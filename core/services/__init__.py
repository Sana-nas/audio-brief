"""Business logic of the app, kept separate from the Django views.

    ai_models      - loads Whisper and BART once, on first use
    audio          - converts any uploaded audio to 16 kHz WAV (pydub / ffmpeg)
    transcription  - speech-to-text with Whisper (with progress reporting)
    summarization  - chunked, abstractive summarization with BART
    pdf            - builds the downloadable PDF report
    jobs           - background queue that runs the whole pipeline for each upload
"""
