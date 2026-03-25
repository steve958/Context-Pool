FROM python:3.12-slim

# System dependencies:
#   poppler-utils — pdf2image needs pdfinfo/pdftoppm to render PDF pages as images
#   libmagic1     — python-magic for file type detection
#   libgl1        — required by some image libraries
#   curl          — used by Docker health check
# Note: OCR is handled by OCR.space REST API (no local Tesseract needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    libmagic1 \
    libgl1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

# SEC-07: Create non-root user and hand off data directory ownership
RUN useradd -m -u 1000 appuser \
    && mkdir -p /data/documents /data/config \
    && chown -R appuser:appuser /data /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
