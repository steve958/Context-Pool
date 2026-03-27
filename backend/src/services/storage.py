"""
File storage layer backed by a docker volume.

Layout:
  /data/documents/
    {ws_id}/
      _index.json       ← workspace + document metadata
      {doc_id}_{filename}
"""

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

DATA_DIR = Path(os.environ.get("DATA_DIR", "/data/documents"))


def ensure_data_dirs():
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _ws_dir(ws_id: str) -> Path:
    return DATA_DIR / ws_id


def _index_path(ws_id: str) -> Path:
    return _ws_dir(ws_id) / "_index.json"


def _read_index(ws_id: str) -> dict:
    p = _index_path(ws_id)
    if not p.exists():
        return {}
    with open(p) as f:
        return json.load(f)


def _write_index(ws_id: str, data: dict):
    with open(_index_path(ws_id), "w") as f:
        json.dump(data, f, indent=2)


# ── Workspace ─────────────────────────────────────────────────────────────────

def create_workspace(name: str) -> dict:
    ws_id = str(uuid.uuid4())
    _ws_dir(ws_id).mkdir(parents=True, exist_ok=True)
    meta = {
        "ws_id": ws_id,
        "name": name,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "documents": {},
    }
    _write_index(ws_id, meta)
    return {"ws_id": ws_id, "name": name, "document_count": 0}


def list_workspaces() -> list[dict]:
    result = []
    if not DATA_DIR.exists():
        return result
    for ws_dir in DATA_DIR.iterdir():
        if ws_dir.is_dir():
            index = _read_index(ws_dir.name)
            if index:
                result.append({
                    "ws_id": index["ws_id"],
                    "name": index.get("name", ws_dir.name),
                    "document_count": len(index.get("documents", {})),
                    "created_at": index.get("created_at"),
                })
    return sorted(result, key=lambda x: x.get("created_at", ""))


def get_workspace(ws_id: str) -> dict | None:
    index = _read_index(ws_id)
    return index if index else None


def workspace_exists(ws_id: str) -> bool:
    """Check if a workspace exists."""
    return _ws_dir(ws_id).exists() and _index_path(ws_id).exists()


# ── Documents ─────────────────────────────────────────────────────────────────

def save_document(ws_id: str, filename: str, content: bytes) -> dict:
    doc_id = str(uuid.uuid4())
    safe_name = filename.replace("/", "_").replace("\\", "_")
    dest = _ws_dir(ws_id) / f"{doc_id}_{safe_name}"
    dest.write_bytes(content)

    doc_meta = {
        "doc_id": doc_id,
        "filename": filename,
        "size": len(content),
        "type": filename.rsplit(".", 1)[-1].lower() if "." in filename else "unknown",
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "path": str(dest),
    }

    index = _read_index(ws_id)
    index.setdefault("documents", {})[doc_id] = doc_meta
    _write_index(ws_id, index)
    return {k: v for k, v in doc_meta.items() if k != "path"}


def list_documents(ws_id: str) -> list[dict]:
    index = _read_index(ws_id)
    docs = index.get("documents", {})
    return [
        {k: v for k, v in doc.items() if k != "path"}
        for doc in sorted(docs.values(), key=lambda d: d.get("uploaded_at", ""))
    ]


def get_document_path(ws_id: str, doc_id: str) -> Path | None:
    index = _read_index(ws_id)
    doc = index.get("documents", {}).get(doc_id)
    if not doc:
        return None
    return Path(doc["path"])


def get_all_document_paths(ws_id: str) -> list[tuple[str, Path]]:
    """Returns list of (doc_id, path) for all documents in a workspace."""
    index = _read_index(ws_id)
    return [
        (doc_id, Path(doc["path"]))
        for doc_id, doc in index.get("documents", {}).items()
        if Path(doc["path"]).exists()
    ]


def delete_workspace(ws_id: str) -> bool:
    import shutil
    ws_dir = _ws_dir(ws_id)
    if not ws_dir.exists():
        return False
    shutil.rmtree(ws_dir, ignore_errors=True)
    return True


def delete_document(ws_id: str, doc_id: str) -> bool:
    index = _read_index(ws_id)
    doc = index.get("documents", {}).pop(doc_id, None)
    if not doc:
        return False
    path = Path(doc["path"])
    if path.exists():
        path.unlink()
    _write_index(ws_id, index)
    return True
