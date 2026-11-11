"""Speech-to-text with OpenAI Whisper."""
import importlib
import io
import logging
from contextlib import contextmanager
from types import SimpleNamespace

from . import ai_models

logger = logging.getLogger(__name__)


@contextmanager
def _whisper_progress(callback):
    """Report Whisper's real progress to ``callback(fraction)``.

    Whisper processes the audio in 30-second windows and advances an internal
    tqdm progress bar after each window. We swap that bar for a silent subclass
    that also calls our callback. If the callback raises (e.g. the job was
    cancelled) the exception stops the transcription.
    """
    if callback is None:
        yield
        return

    import tqdm
    # NB: ``import whisper.transcribe`` would give the *function* of that name, so go via importlib
    whisper_transcribe_module = importlib.import_module("whisper.transcribe")

    class ProgressBar(tqdm.tqdm):
        def __init__(self, *args, **kwargs):
            kwargs["file"] = io.StringIO()  # keep the console clean
            super().__init__(*args, **kwargs)

        def update(self, n=1):
            result = super().update(n)
            if self.total:
                callback(min(1.0, self.n / self.total))
            return result

    original = whisper_transcribe_module.tqdm
    whisper_transcribe_module.tqdm = SimpleNamespace(tqdm=ProgressBar)
    try:
        yield
    finally:
        whisper_transcribe_module.tqdm = original


def _run(model, wav_path, on_progress):
    with _whisper_progress(on_progress):
        # verbose=False switches Whisper's progress bar on (we hook it above)
        result = model.transcribe(
            wav_path, language="en", verbose=False,
            fp16=(ai_models.get_device() == "cuda"),
        )
    return result["text"].strip()


def transcribe_audio(wav_path, on_progress=None):
    """Return the transcription text of a WAV file.

    ``on_progress`` (optional) is called with a number between 0 and 1.
    """
    try:
        return _run(ai_models.get_whisper(), wav_path, on_progress)
    except RuntimeError as e:
        logger.error(f"Runtime error in Whisper transcription: {e}")
        if "CUDA" in str(e) and ai_models.get_device() == "cuda":
            ai_models.fall_back_to_cpu()
            return _run(ai_models.get_whisper(), wav_path, on_progress)
        raise
