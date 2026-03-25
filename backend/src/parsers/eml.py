"""EML email parser using Python stdlib `email`."""

import email
import email.policy
from email.message import EmailMessage
from pathlib import Path
from typing import Literal

from src.parsers import html as html_parser
from src.parsers.normalize import normalize


def parse(content: bytes, scope: Literal["body", "attachments", "both"] = "both", ocr_enabled: bool = False) -> str:
    msg: EmailMessage = email.message_from_bytes(content, policy=email.policy.default)
    parts: list[str] = []

    if scope in ("body", "both"):
        body = _extract_body(msg)
        if body:
            parts.append("## Email Body\n\n" + body)

    if scope in ("attachments", "both"):
        for attachment_md in _extract_attachments(msg, ocr_enabled):
            parts.append(attachment_md)

    return "\n\n".join(parts)


def _extract_body(msg: EmailMessage) -> str:
    body = msg.get_body(preferencelist=("plain", "html"))
    if body is None:
        return ""
    payload = body.get_payload(decode=True)
    if not payload:
        return ""
    if body.get_content_type() == "text/html":
        return html_parser.parse(payload)
    return payload.decode(body.get_content_charset("utf-8"), errors="replace")


def _extract_attachments(msg: EmailMessage, ocr_enabled: bool) -> list[str]:
    from src.parsers import pdf, ocr as ocr_parser, docx, txt

    results = []
    for part in msg.walk():
        if part.get_content_disposition() != "attachment":
            continue
        filename = part.get_filename() or "attachment"
        payload = part.get_payload(decode=True)
        if not payload:
            continue

        suffix = Path(filename).suffix.lower()
        try:
            if suffix == ".pdf":
                md = ocr_parser.parse_pdf(payload) if ocr_enabled else pdf.parse(payload)
            elif suffix == ".docx":
                md = docx.parse(payload)
            elif suffix in (".png", ".jpg", ".jpeg"):
                md = ocr_parser.parse_image(payload) if ocr_enabled else f"[Image attachment: {filename} — enable OCR to extract text]"
            else:
                md = txt.parse(payload)
            results.append(f"## Attachment: {filename}\n\n{normalize(md)}")
        except Exception as e:
            results.append(f"## Attachment: {filename}\n\n[Failed to parse: {e}]")

    return results
