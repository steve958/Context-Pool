"""
OCR parser for scanned PDFs and standalone images (opt-in).

Uses OCR.space REST API (https://ocr.space/ocrapi).
API key is read from the OCR_API_KEY environment variable.
"""

import base64
import io
import os

import requests
from pdf2image import convert_from_bytes

OCR_SPACE_URL = "https://api.ocr.space/parse/image"
_API_KEY = None


def _api_key() -> str:
    global _API_KEY
    if _API_KEY is None:
        key = os.environ.get("OCR_API_KEY", "")
        if not key:
            raise RuntimeError(
                "OCR_API_KEY environment variable is not set. "
                "Set it in docker-compose.yml or your shell before enabling OCR."
            )
        _API_KEY = key
    return _API_KEY


def _ocr_image_bytes(image_bytes: bytes, filename: str = "image.png") -> str:
    """Send raw image bytes to OCR.space and return extracted text."""
    encoded = base64.b64encode(image_bytes).decode("utf-8")
    ext = filename.rsplit(".", 1)[-1].lower()
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png"}.get(ext, "image/png")

    payload = {
        "apikey": _api_key(),
        "base64Image": f"data:{mime};base64,{encoded}",
        "language": "eng",
        "isOverlayRequired": False,
        "detectOrientation": True,
        "scale": True,
        "OCREngine": 2,  # Engine 2 is better for printed text
    }

    response = requests.post(OCR_SPACE_URL, data=payload, timeout=60)
    response.raise_for_status()

    result = response.json()
    if result.get("IsErroredOnProcessing"):
        error_msg = result.get("ErrorMessage", ["Unknown OCR error"])
        raise RuntimeError(f"OCR.space error: {error_msg}")

    parsed_results = result.get("ParsedResults", [])
    if not parsed_results:
        return ""

    return parsed_results[0].get("ParsedText", "")


def parse_pdf(content: bytes) -> str:
    """Convert each page of a scanned PDF to an image, then OCR via OCR.space."""
    images = convert_from_bytes(content, fmt="png")
    parts: list[str] = []

    for page_num, image in enumerate(images, start=1):
        buf = io.BytesIO()
        image.save(buf, format="PNG")
        image_bytes = buf.getvalue()

        parts.append(f"\n--- page {page_num} ---\n")
        parts.append(f"<!-- OCR: page {page_num} -->")
        text = _ocr_image_bytes(image_bytes, filename=f"page_{page_num}.png")
        parts.append(text)

    return "\n".join(parts)


def parse_image(content: bytes, filename: str = "image.png") -> str:
    """OCR a standalone image file via OCR.space."""
    text = _ocr_image_bytes(content, filename=filename)
    return f"<!-- OCR: image -->\n{text}"
