import unicodedata

import magic
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from src.services.storage import (
    delete_document,
    get_workspace,
    list_documents,
    save_document,
)

router = APIRouter(tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".html", ".htm", ".eml", ".png", ".jpg", ".jpeg"}

# Mapping of allowed MIME types → expected extension groups
ALLOWED_MIMES = {
    "application/pdf": {".pdf"},
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {".docx"},
    "text/plain": {".txt", ".md"},
    "text/markdown": {".txt", ".md"},
    "text/html": {".html", ".htm"},
    "message/rfc822": {".eml"},
    "image/png": {".png"},
    "image/jpeg": {".jpg", ".jpeg"},
}

# 100 MB per file
_MAX_FILE_BYTES = 100 * 1024 * 1024


def _sanitize_filename(filename: str) -> str:
    """Strip path traversal characters and normalise to ASCII-safe name."""
    # Normalise unicode to NFKD, keep only safe chars
    name = unicodedata.normalize("NFKD", filename)
    name = "".join(c for c in name if c.isalnum() or c in "._- ")
    name = name.strip("._- ")
    return name[:255] or "upload"


@router.post("/workspaces/{ws_id}/documents", status_code=201)
async def upload_documents(ws_id: str, files: list[UploadFile] = File(...)):
    workspace = get_workspace(ws_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    results = []
    for file in files:
        # Extension check
        suffix = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if suffix not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=422,
                detail=f"File type '{suffix}' is not supported. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            )

        content = await file.read()

        # Size check
        if len(content) > _MAX_FILE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File '{file.filename}' exceeds the 100 MB limit ({len(content) // (1024*1024)} MB).",
            )

        # MIME type check
        detected_mime = magic.from_buffer(content, mime=True)
        allowed_for_mime = ALLOWED_MIMES.get(detected_mime, set())
        if suffix not in allowed_for_mime:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"File content type '{detected_mime}' does not match "
                    f"the declared extension '{suffix}'."
                ),
            )

        safe_name = _sanitize_filename(file.filename)
        doc = save_document(ws_id, safe_name, content)
        results.append(doc)

    return {"documents": results}


@router.get("/workspaces/{ws_id}/documents")
async def list_documents_endpoint(ws_id: str):
    if not get_workspace(ws_id):
        raise HTTPException(status_code=404, detail="Workspace not found")
    return {"documents": list_documents(ws_id)}


@router.delete("/workspaces/{ws_id}/documents/{doc_id}", status_code=204)
async def delete_document_endpoint(ws_id: str, doc_id: str):
    if not get_workspace(ws_id):
        raise HTTPException(status_code=404, detail="Workspace not found")
    deleted = delete_document(ws_id, doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
