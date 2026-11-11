"""Builds the downloadable PDF report with ReportLab."""
import io
import re
from datetime import datetime
from xml.sax.saxutils import escape as xml_escape

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer


def pdf_filename(audio_filename):
    """A safe download name such as ``transcription_my_talk.mp3.pdf``."""
    safe_name = re.sub(r'[^\w\-_.]', '_', audio_filename)
    return f"transcription_{safe_name}.pdf"


def _page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.drawCentredString(letter[0] / 2, 0.5 * inch, f"AudioBrief  -  page {doc.page}")
    canvas.restoreState()


def build_pdf(audio_filename, transcription, summary):
    """Return the PDF (as bytes) containing the transcription and, if given, the summary."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, title="Audio Transcription & Summary")

    styles = getSampleStyleSheet()
    content_style = ParagraphStyle(
        'Content', parent=styles['Normal'], fontSize=10, leading=14, spaceBefore=10, spaceAfter=10)
    meta_style = ParagraphStyle('Meta', parent=styles['Normal'], textColor="#555555")

    # ReportLab's Paragraph parses XML-like markup, so all user/model text must be
    # escaped or characters such as "<" and "&" make the PDF build crash.
    story = [
        Paragraph("Audio Transcription & Summary", styles['Heading1']),
        Paragraph(f"<b>File:</b> {xml_escape(audio_filename)}", styles['Normal']),
        Paragraph(f"Generated on {datetime.now():%d %B %Y, %H:%M}", meta_style),
        Spacer(1, 0.25 * inch),
        Paragraph("Transcription", styles['Heading2']),
        Spacer(1, 0.1 * inch),
        Paragraph(xml_escape(transcription), content_style),
    ]
    if summary:
        story += [
            PageBreak(),
            Paragraph("Summary", styles['Heading2']),
            Spacer(1, 0.1 * inch),
            Paragraph(xml_escape(summary), content_style),
        ]

    doc.build(story, onFirstPage=_page_number, onLaterPages=_page_number)
    return buffer.getvalue()
