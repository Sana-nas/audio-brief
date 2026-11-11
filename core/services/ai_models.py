"""Loads the two AI models once and shares them.

The models are big (BART-large-cnn is ~1.6 GB), so they are loaded lazily, the
first time they are needed (or in the background when the dev server starts),
instead of every time Django imports the code. This keeps commands such as
``manage.py migrate`` fast.
"""
import logging
import os
import threading

logger = logging.getLogger(__name__)

# Whisper size can be changed with the WHISPER_MODEL environment variable
# (tiny, base, small, medium, large). "base" is a good speed/accuracy balance on CPU.
WHISPER_MODEL_NAME = os.environ.get("WHISPER_MODEL", "base")
BART_MODEL_NAME = "facebook/bart-large-cnn"

_lock = threading.Lock()
_models = {"device": None, "whisper": None, "bart": None, "tokenizer": None}


def _pick_device():
    import torch
    return "cuda" if torch.cuda.is_available() else "cpu"


def models_loaded():
    return _models["whisper"] is not None and _models["bart"] is not None


def preload():
    """Load both models if they are not loaded yet. Safe to call from several threads."""
    if models_loaded():
        return
    with _lock:
        if models_loaded():
            return
        import whisper
        from transformers import BartForConditionalGeneration, BartTokenizer

        device = _pick_device()
        logger.info(f"Loading models on {device.upper()}...")
        _models["whisper"] = whisper.load_model(WHISPER_MODEL_NAME, device=device)
        _models["bart"] = BartForConditionalGeneration.from_pretrained(BART_MODEL_NAME).to(device)
        _models["tokenizer"] = BartTokenizer.from_pretrained(BART_MODEL_NAME)
        _models["device"] = device
        logger.info(f"Models loaded (Whisper {WHISPER_MODEL_NAME}, {BART_MODEL_NAME}) on {device.upper()}")


def get_device():
    preload()
    return _models["device"]


def get_whisper():
    preload()
    return _models["whisper"]


def get_bart():
    """Return (bart_model, bart_tokenizer)."""
    preload()
    return _models["bart"], _models["tokenizer"]


def fall_back_to_cpu():
    """Called when a CUDA error happens: move both models to the CPU for good."""
    with _lock:
        logger.warning("CUDA error - moving models to the CPU")
        _models["whisper"].to("cpu")
        _models["bart"].to("cpu")
        _models["device"] = "cpu"
