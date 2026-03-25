"""Text-based PDF parser using PyMuPDF."""

import fitz  # pymupdf


def parse(content: bytes) -> str:
    doc = fitz.open(stream=content, filetype="pdf")
    parts: list[str] = []
    for page_num, page in enumerate(doc, start=1):
        parts.append(f"\n--- page {page_num} ---\n")
        parts.append(page.get_text("text"))
    doc.close()
    return "\n".join(parts)
