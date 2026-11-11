"""Audio conversion with pydub (which calls ffmpeg)."""
import logging
import os

from pydub import AudioSegment

logger = logging.getLogger(__name__)

SUPPORTED_FORMATS = ('.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac')


def convert_to_wav(source_path):
    """Convert any supported audio file to a 16 kHz mono WAV, the format Whisper expects.

    Returns (wav_path, duration_in_seconds). Raises pydub's CouldntDecodeError
    if the file is not valid audio, or FileNotFoundError if ffmpeg is missing.
    """
    audio = AudioSegment.from_file(source_path)
    duration = len(audio) / 1000
    wav_path = os.path.splitext(source_path)[0] + "_16k.wav"
    audio.export(wav_path, format="wav", parameters=["-ar", "16000", "-ac", "1"])
    logger.info(f"Converted {os.path.basename(source_path)} ({duration:.1f}s) to WAV")
    return wav_path, duration
