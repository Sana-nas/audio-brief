"""Background processing of uploaded audio.

Why this exists
---------------
Transcribing and summarizing a long recording takes a minute or more on a CPU.
Doing that inside the HTTP request freezes the browser page. Instead:

1. the upload view saves the file, creates a ``Job`` and returns immediately;
2. a single background worker thread takes jobs from a queue and runs the
   pipeline (load models -> convert -> transcribe -> summarize);
3. the page polls ``/transcribe/job/<id>/status/`` every second and draws a
   real progress bar from the numbers the pipeline reports.

Design notes
------------
* One worker = one job at a time. The models are CPU/GPU hungry, so running
  several jobs in parallel would just make every job slower. Extra uploads wait
  in the queue and the user sees "N job(s) ahead of you".
* Jobs live in memory, not in the database. That keeps this academic project
  simple (no new tables), but results vanish when the server restarts and it
  only works with a single server process. A production system would use
  Celery + Redis and a database table instead - the rest of the code would stay
  the same because everything goes through this module.
"""
import logging
import os
import queue
import tempfile
import threading
import time
import uuid
from dataclasses import dataclass, field
from typing import Optional

from django.core.files.storage import FileSystemStorage
from pydub.exceptions import CouldntDecodeError

from . import ai_models, audio, summarization, transcription

logger = logging.getLogger(__name__)

UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "audiobrief_uploads")
RESULT_TTL_SECONDS = 60 * 60          # finished jobs are forgotten after one hour
STALE_UPLOAD_SECONDS = 2 * 60 * 60    # leftover upload files older than this are deleted

# Which part of the overall 0-100 progress bar each stage fills.
STAGE_RANGES = {
    "loading": (0, 5),
    "converting": (5, 10),
    "transcribing": (10, 40),
    "summarizing": (40, 100),
}

ACTIVE_STATES = ("queued", "running")
FINISHED_STATES = ("done", "failed", "cancelled")


class JobCancelled(Exception):
    """Raised inside the pipeline when the user cancels the job."""


class NoSpeechError(Exception):
    pass


@dataclass
class Job:
    id: str
    user_id: int
    filename: str
    file_path: str
    created_at: float = field(default_factory=time.time)
    state: str = "queued"            # queued | running | done | failed | cancelled
    stage: str = "queued"            # queued | loading | converting | transcribing | summarizing | finished
    stage_progress: Optional[float] = None   # 0..1 inside the current stage, None = unknown
    progress: float = 0.0            # 0..100 overall (never goes backwards)
    message: str = "Waiting for your turn..."
    error: str = ""
    started_at: Optional[float] = None
    finished_at: Optional[float] = None
    cancel_requested: bool = False
    # results
    transcription: str = ""
    summary: str = ""
    audio_duration: float = 0.0
    timings: dict = field(default_factory=dict)
    # internal
    wav_path: Optional[str] = None


class JobManager:
    def __init__(self):
        self._jobs = {}
        self._queue = queue.Queue()
        self._lock = threading.RLock()
        self._worker = None

    # ---------------------------------------------------------------- public API
    def submit(self, user_id, filename, file_path):
        self._purge_old()
        job = Job(id=uuid.uuid4().hex, user_id=user_id, filename=filename, file_path=file_path)
        with self._lock:
            self._jobs[job.id] = job
        self._ensure_worker()
        self._queue.put(job)
        logger.info(f"Job {job.id[:8]} queued for {filename}")
        return job

    def get(self, job_id, user_id=None):
        """Return the job, or None. If user_id is given, only that user's jobs are visible."""
        job = self._jobs.get(job_id)
        if job is None or (user_id is not None and job.user_id != user_id):
            return None
        return job

    def active_job_for(self, user_id):
        with self._lock:
            for job in self._jobs.values():
                if job.user_id == user_id and job.state in ACTIVE_STATES:
                    return job
        return None

    def cancel(self, job):
        with self._lock:
            if job.state in FINISHED_STATES:
                return
            job.cancel_requested = True
            if job.state == "queued":
                # never started: finish it right away (the worker will skip it)
                self._finish(job, "cancelled", message="Cancelled.")
                self._remove_files(job)

    def status(self, job):
        """A JSON-friendly snapshot of the job for the progress page."""
        with self._lock:
            end = job.finished_at or time.time()
            began = job.started_at or job.created_at
            ahead = 0
            if job.state == "queued":
                ahead = sum(
                    1 for j in self._jobs.values()
                    if j.state in ACTIVE_STATES and j.created_at < job.created_at)
            return {
                "id": job.id,
                "state": job.state,
                "stage": job.stage,
                "stage_progress": job.stage_progress,
                "progress": round(job.progress, 1),
                "message": job.message,
                "error": job.error,
                "filename": job.filename,
                "elapsed": round(end - began, 1),
                "queue_ahead": ahead,
                "finished": job.state in FINISHED_STATES,
            }

    # ------------------------------------------------------------ worker thread
    def _ensure_worker(self):
        with self._lock:
            if self._worker is None or not self._worker.is_alive():
                self._worker = threading.Thread(target=self._work_forever, name="job-worker", daemon=True)
                self._worker.start()

    def _work_forever(self):
        while True:
            job = self._queue.get()
            try:
                if job.state == "queued":        # not cancelled while waiting
                    self._process(job)
            except Exception:                    # _process handles its own errors; this is a safety net
                logger.exception("Unexpected error in job worker")
            finally:
                self._queue.task_done()

    def _process(self, job):
        with self._lock:
            job.state = "running"
            job.started_at = time.time()
        timings = {}
        outcome = ("failed", "Something went wrong.", "Unexpected error.")   # (state, message, error)
        try:
            if not ai_models.models_loaded():
                self._set_stage(job, "loading", "Loading the AI models (only needed once after the server starts)...")
                ai_models.preload()
            self._check_cancel(job)

            self._set_stage(job, "converting", "Preparing your audio...")
            t = time.time()
            job.wav_path, job.audio_duration = audio.convert_to_wav(job.file_path)
            timings["convert"] = time.time() - t
            self._check_cancel(job)

            self._set_stage(job, "transcribing", "Listening to your audio and writing it down...", fraction=0.0)
            t = time.time()
            text = transcription.transcribe_audio(
                job.wav_path, on_progress=lambda f: self._report(job, "transcribing", f))
            timings["transcribe"] = time.time() - t
            if not text.strip():
                raise NoSpeechError("No speech was detected in this audio file.")
            job.transcription = text
            self._check_cancel(job)

            self._set_stage(job, "summarizing", "Condensing the transcript into a summary...", fraction=0.0)
            t = time.time()
            try:
                job.summary = summarization.chunk_and_summarize(
                    text, on_progress=lambda f: self._report(job, "summarizing", f))
            except JobCancelled:
                raise
            except Exception as e:
                logger.error(f"Error in summarization: {e}")
                job.summary = "Error generating summary. Please try again."
            timings["summarize"] = time.time() - t

            job.timings = timings
            with self._lock:
                job.stage = "finished"
                job.stage_progress = 1.0
                job.progress = 100.0
            outcome = ("done", "Finished.", "")
        except JobCancelled:
            outcome = ("cancelled", "Cancelled.", "")
        except Exception as e:
            logger.error(f"Job {job.id[:8]} failed: {e}", exc_info=True)
            outcome = ("failed", "Something went wrong.", self._friendly_error(e))
        finally:
            self._remove_files(job)
        # Only now announce the result: by the time a page sees "done", the temp files are gone.
        state, message, error = outcome
        self._finish(job, state, message=message, error=error)

    # ------------------------------------------------------------------ helpers
    @staticmethod
    def _friendly_error(error):
        if isinstance(error, CouldntDecodeError):
            return "Could not read this file. It may be corrupted or not a real audio file."
        if isinstance(error, FileNotFoundError):
            return "Audio conversion failed. Make sure ffmpeg is installed and on your PATH."
        return str(error) or "Unexpected error."

    def _check_cancel(self, job):
        if job.cancel_requested:
            raise JobCancelled()

    def _set_stage(self, job, stage, message, fraction=None):
        self._check_cancel(job)
        with self._lock:
            job.stage = stage
            job.message = message
            job.stage_progress = fraction
            job.progress = max(job.progress, STAGE_RANGES[stage][0])

    def _report(self, job, stage, fraction):
        """Progress callback used by the transcription / summarization code."""
        self._check_cancel(job)
        low, high = STAGE_RANGES[stage]
        with self._lock:
            job.stage_progress = fraction
            job.progress = max(job.progress, low + (high - low) * fraction)

    def _finish(self, job, state, message="", error=""):
        with self._lock:
            job.state = state
            job.message = message
            job.error = error
            job.finished_at = time.time()
            if job.started_at is None:
                job.started_at = job.finished_at

    @staticmethod
    def _remove_files(job):
        for path in (job.file_path, job.wav_path):
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError as e:
                    logger.warning(f"Could not delete {path}: {e}")

    def _purge_old(self):
        """Forget old finished jobs and delete leftover upload files."""
        now = time.time()
        with self._lock:
            for job_id in [j.id for j in self._jobs.values()
                           if j.finished_at and now - j.finished_at > RESULT_TTL_SECONDS]:
                del self._jobs[job_id]
        if os.path.isdir(UPLOAD_DIR):
            for name in os.listdir(UPLOAD_DIR):
                path = os.path.join(UPLOAD_DIR, name)
                try:
                    if now - os.path.getmtime(path) > STALE_UPLOAD_SECONDS:
                        os.remove(path)
                except OSError:
                    pass


manager = JobManager()


def save_upload(uploaded_file):
    """Store an uploaded file in the temp upload folder and return its path."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    storage = FileSystemStorage(location=UPLOAD_DIR)
    name = storage.save(uploaded_file.name, uploaded_file)
    return storage.path(name)
