"""Abstractive summarization with BART (facebook/bart-large-cnn).

BART can read at most 1024 tokens at once, so long transcripts are split into
chunks of whole sentences, each chunk is summarized, and the partial summaries
are joined (or summarized again if they are still too long for one pass).
"""
import logging
import re

from . import ai_models

logger = logging.getLogger(__name__)

# Words per chunk. 350 words is roughly 470 BART tokens, safely under the 1024 limit,
# and small enough that every part of a long recording gets represented in the summary.
CHUNK_WORDS = 350
# Below this many words there is nothing worth summarizing; the text is returned as-is.
MIN_WORDS_TO_SUMMARIZE = 40


def _clamp(value, low, high):
    return max(low, min(high, value))


def summarize_text(text, max_new_tokens=None, min_length=None, device_name=None):
    """Summarize one chunk of text (must fit in BART's 1024-token window).

    Summary length is scaled to the input length, so short inputs do not get
    padded with invented sentences. Decoding is deterministic (beam search).
    """
    import torch

    device_name = device_name or ai_models.get_device()
    try:
        if not text.strip():
            logger.warning("Empty text")
            return ""
        n_words = len(text.split())
        if max_new_tokens is None:
            # Generous upper bound; beam search normally stops on its own well before this.
            max_new_tokens = _clamp(int(n_words * 0.9), 60, 300)
        if min_length is None:
            min_length = _clamp(int(n_words * 0.2), 15, 100)
        min_length = min(min_length, max_new_tokens - 1)
        logger.info(f"Summarizing {n_words} words, max_new_tokens={max_new_tokens}, min_length={min_length}")

        bart_model, bart_tokenizer = ai_models.get_bart()
        if device_name == "cuda":
            torch.cuda.empty_cache()
        inputs = bart_tokenizer(
            text,
            truncation=True,
            return_tensors="pt",
            max_length=1024,
            return_attention_mask=True,
        ).to(device_name)
        summary_ids = bart_model.generate(
            inputs["input_ids"],
            attention_mask=inputs["attention_mask"],
            max_new_tokens=max_new_tokens,
            min_length=min_length,
            num_beams=4,
            length_penalty=2.0,
            no_repeat_ngram_size=3,
            early_stopping=True,
            do_sample=False,
        )
        summary = bart_tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        logger.info(f"Summary length: {len(summary.split())} words")
        return summary
    except Exception as e:
        logger.error(f"Summarization error: {e}")
        if "CUDA" in str(e) and device_name == "cuda":
            ai_models.fall_back_to_cpu()
            return summarize_text(text, max_new_tokens, min_length, device_name="cpu")
        return ""


def split_into_chunks(text, chunk_words=CHUNK_WORDS):
    """Split text into chunks of whole sentences, each at most ~chunk_words words."""
    sentences = [s for s in re.split(r'(?<=[.!?])\s+', text.strip()) if s]
    chunks, current, count = [], [], 0
    for sentence in sentences:
        n = len(sentence.split())
        if current and count + n > chunk_words:
            chunks.append(" ".join(current))
            current, count = [], 0
        current.append(sentence)
        count += n
    if current:
        chunks.append(" ".join(current))
    return chunks


def clean_summary(summary):
    """Tidy whitespace and drop a trailing sentence fragment cut off by the token limit."""
    summary = re.sub(r'\s+', ' ', summary).strip()
    if summary and summary[-1] not in '.!?':
        last_end = max(summary.rfind('. '), summary.rfind('! '), summary.rfind('? '))
        if last_end != -1:
            summary = summary[:last_end + 1]
        else:
            summary += '.'
    return summary


def chunk_and_summarize(transcription, on_progress=None):
    """Summarize a transcription of any length.

    Long transcripts are split into sentence-aligned chunks, each chunk is
    summarized, and the partial summaries are summarized again until they fit
    in one pass. Nothing is silently truncated.

    ``on_progress`` (optional) is called with a number between 0 and 1 after
    every chunk. It may raise an exception to abort (used for cancelling).
    """
    def report(fraction):
        if on_progress:
            on_progress(fraction)

    text = transcription.strip()
    n_words = len(text.split())
    logger.info(f"Summarizing transcription with {n_words} words")
    if n_words < MIN_WORDS_TO_SUMMARIZE:
        return text

    summary = ""
    for round_number in range(4):  # safety bound on the number of reduction rounds
        chunks = split_into_chunks(text)
        if len(chunks) == 1:
            summary = clean_summary(summarize_text(chunks[0]))
            break
        logger.info(f"Summarizing {len(chunks)} chunks")
        # Round 1 fills 0 -> 0.9 of the bar; any extra reduction round fills the rest.
        low, high = (0.0, 0.9) if round_number == 0 else (0.9, 1.0)
        partials = []
        for i, chunk in enumerate(chunks):
            report(low + (high - low) * i / len(chunks))
            partials.append(clean_summary(summarize_text(chunk)))
        text = " ".join(p for p in partials if p)
        if not text:
            break
        if len(text.split()) <= CHUNK_WORDS:
            # The joined chunk summaries are already short enough: keep them all
            # (summarizing again would drop whole topics).
            summary = text
            break
    else:
        summary = text

    report(1.0)
    if not summary.strip():
        return "Unable to generate final summary."
    return summary
