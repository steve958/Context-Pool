"""
Persistent storage for query runs.

Handles atomic reads/writes and index management.
Uses gzip compression for storage efficiency.
"""

import gzip
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

# Base directory for all run storage
RUNS_DIR = Path("/data/runs")
INDEX_FILE = RUNS_DIR / "index.json"


@dataclass
class PersistedRun:
    """A persisted query run with full data."""

    run_id: str
    workspace_id: str
    doc_id: Optional[str]
    question: str
    created_at: str
    completed_at: Optional[str]
    status: str
    config_snapshot: dict
    result: Optional[dict]
    pool: list[dict]

    @property
    def metadata(self) -> dict[str, Any]:
        """Summary for list views."""
        positive_hits = len(self.pool) if self.pool else 0
        doc_count = len({h["doc_id"] for h in self.pool if "doc_id" in h}) if self.pool else 0

        return {
            "run_id": self.run_id,
            "question": self.question,
            "created_at": self.created_at,
            "status": self.status,
            "document_count": doc_count,
            "positive_hits": positive_hits,
        }

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "run_id": self.run_id,
            "workspace_id": self.workspace_id,
            "doc_id": self.doc_id,
            "question": self.question,
            "created_at": self.created_at,
            "completed_at": self.completed_at,
            "status": self.status,
            "config_snapshot": self.config_snapshot,
            "result": self.result,
            "pool": self.pool,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "PersistedRun":
        """Create from dictionary."""
        return cls(
            run_id=data["run_id"],
            workspace_id=data["workspace_id"],
            doc_id=data.get("doc_id"),
            question=data["question"],
            created_at=data["created_at"],
            completed_at=data.get("completed_at"),
            status=data["status"],
            config_snapshot=data.get("config_snapshot", {}),
            result=data.get("result"),
            pool=data.get("pool", []),
        )


class RunRepository:
    """File-based run persistence with index management."""

    @classmethod
    def ensure_dirs(cls) -> None:
        """Ensure the runs directory exists."""
        RUNS_DIR.mkdir(parents=True, exist_ok=True)

    @classmethod
    def _workspace_dir(cls, ws_id: str) -> Path:
        """Get or create workspace directory."""
        path = RUNS_DIR / ws_id
        path.mkdir(exist_ok=True)
        return path

    @classmethod
    def _run_path(cls, ws_id: str, run_id: str) -> Path:
        """Get the path for a run file."""
        return cls._workspace_dir(ws_id) / f"{run_id}.json.gz"

    @classmethod
    def save(cls, run_data: dict[str, Any] | PersistedRun) -> None:
        """
        Atomically persist a run to disk.
        Uses write-then-rename pattern for safety.
        """
        # Normalize input to PersistedRun
        if isinstance(run_data, dict):
            run = PersistedRun.from_dict(run_data)
        else:
            run = run_data

        ws_id = run.workspace_id
        run_id = run.run_id

        run_path = cls._run_path(ws_id, run_id)
        temp_path = run_path.with_suffix(".tmp")

        try:
            # Serialize and compress
            json_bytes = json.dumps(run.to_dict(), ensure_ascii=False, indent=2).encode("utf-8")
            compressed = gzip.compress(json_bytes, compresslevel=6)

            # Atomic write: write to temp, then rename
            temp_path.write_bytes(compressed)
            temp_path.replace(run_path)

            # Update index
            cls._add_to_index(ws_id, run_id)
        except Exception:
            # Clean up temp file if something went wrong
            if temp_path.exists():
                temp_path.unlink()
            raise

    @classmethod
    def load(cls, ws_id: str, run_id: str) -> Optional[PersistedRun]:
        """Load a persisted run."""
        run_path = cls._run_path(ws_id, run_id)
        if not run_path.exists():
            return None

        try:
            compressed = run_path.read_bytes()
            json_bytes = gzip.decompress(compressed)
            data = json.loads(json_bytes)
            return PersistedRun.from_dict(data)
        except (gzip.BadGzipFile, json.JSONDecodeError, KeyError):
            # Corrupted file - remove it and clean index
            run_path.unlink(missing_ok=True)
            cls._remove_from_index(ws_id, run_id)
            return None

    @classmethod
    def list_for_workspace(
        cls,
        ws_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[dict[str, Any]], int]:
        """
        List run metadata for a workspace, sorted by created_at desc.
        Returns (runs, total_count).
        """
        ws_dir = cls._workspace_dir(ws_id)
        if not ws_dir.exists():
            return [], 0

        # Get all run files with their modification times for sorting
        run_files = list(ws_dir.glob("*.json.gz"))
        
        # Sort by mtime (newest first) as a proxy for created_at
        # This avoids decompressing all files just to get the timestamp
        run_files.sort(key=lambda p: p.stat().st_mtime, reverse=True)

        total = len(run_files)

        # Slice for pagination
        page_files = run_files[offset:offset + limit]

        # Load metadata for each
        runs = []
        for run_file in page_files:
            run_id = run_file.stem.replace(".json", "")
            metadata = cls._quick_metadata(ws_id, run_id)
            if metadata:
                runs.append(metadata)

        return runs, total

    @classmethod
    def delete(cls, ws_id: str, run_id: str) -> bool:
        """Delete a run. Returns True if existed."""
        run_path = cls._run_path(ws_id, run_id)
        existed = run_path.exists()
        if existed:
            run_path.unlink()
            cls._remove_from_index(ws_id, run_id)
        return existed

    @classmethod
    def clear_workspace(cls, ws_id: str) -> int:
        """Delete all runs for a workspace. Returns count deleted."""
        ws_dir = RUNS_DIR / ws_id
        if not ws_dir.exists():
            return 0

        count = 0
        for run_file in ws_dir.glob("*.json.gz"):
            run_file.unlink()
            count += 1

        # Remove empty directory
        try:
            ws_dir.rmdir()
        except OSError:
            # Directory not empty or other error
            pass

        # Clear from index
        cls._clear_workspace_from_index(ws_id)
        return count

    # --- Index Management ---

    @classmethod
    def _load_index(cls) -> dict[str, Any]:
        """Load the workspace index."""
        if not INDEX_FILE.exists():
            return {"version": 1, "last_updated": None, "workspaces": {}}
        try:
            return json.loads(INDEX_FILE.read_text())
        except json.JSONDecodeError:
            # Corrupted index - rebuild
            return {"version": 1, "last_updated": None, "workspaces": {}}

    @classmethod
    def _save_index(cls, index: dict[str, Any]) -> None:
        """Save the workspace index atomically."""
        temp = INDEX_FILE.with_suffix(".tmp")
        try:
            index["last_updated"] = datetime.now(timezone.utc).isoformat()
            temp.write_text(json.dumps(index, indent=2))
            temp.replace(INDEX_FILE)
        except Exception:
            if temp.exists():
                temp.unlink()
            raise

    @classmethod
    def _add_to_index(cls, ws_id: str, run_id: str) -> None:
        """Add a run to the workspace index."""
        index = cls._load_index()
        ws_data = index["workspaces"].setdefault(ws_id, {
            "run_ids": [],
            "run_count": 0,
            "last_run_at": None
        })
        
        if run_id not in ws_data["run_ids"]:
            ws_data["run_ids"].append(run_id)
            ws_data["run_count"] = len(ws_data["run_ids"])
        
        ws_data["last_run_at"] = datetime.now(timezone.utc).isoformat()
        cls._save_index(index)

    @classmethod
    def _remove_from_index(cls, ws_id: str, run_id: str) -> None:
        """Remove a run from the workspace index."""
        index = cls._load_index()
        ws_data = index["workspaces"].get(ws_id)
        if ws_data and run_id in ws_data["run_ids"]:
            ws_data["run_ids"].remove(run_id)
            ws_data["run_count"] = len(ws_data["run_ids"])
            if ws_data["run_count"] == 0:
                # Clean up empty workspace entry
                del index["workspaces"][ws_id]
            cls._save_index(index)

    @classmethod
    def _clear_workspace_from_index(cls, ws_id: str) -> None:
        """Remove a workspace from the index."""
        index = cls._load_index()
        if ws_id in index["workspaces"]:
            del index["workspaces"][ws_id]
            cls._save_index(index)

    @classmethod
    def _quick_metadata(cls, ws_id: str, run_id: str) -> Optional[dict[str, Any]]:
        """Extract metadata without full decompress if possible."""
        # For now, do full load but only return metadata
        # Future optimization: store metadata separately
        run = cls.load(ws_id, run_id)
        return run.metadata if run else None

    @classmethod
    def rebuild_index(cls) -> dict[str, int]:
        """
        Rebuild the entire index from filesystem.
        Returns workspace_id -> run_count mapping.
        """
        index = {"version": 1, "last_updated": None, "workspaces": {}}
        
        if not RUNS_DIR.exists():
            cls._save_index(index)
            return {}

        for ws_dir in RUNS_DIR.iterdir():
            if not ws_dir.is_dir():
                continue
            
            ws_id = ws_dir.name
            run_ids = [f.stem.replace(".json", "") for f in ws_dir.glob("*.json.gz")]
            
            if run_ids:
                # Get most recent mtime
                newest = max(f.stat().st_mtime for f in ws_dir.glob("*.json.gz"))
                index["workspaces"][ws_id] = {
                    "run_ids": run_ids,
                    "run_count": len(run_ids),
                    "last_run_at": datetime.fromtimestamp(newest, timezone.utc).isoformat()
                }

        cls._save_index(index)
        return {ws: data["run_count"] for ws, data in index["workspaces"].items()}
