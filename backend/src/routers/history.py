"""
History API for persisted query runs.

Provides endpoints to list, view, delete, and re-run historical queries.
"""

from typing import Literal

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel

from src.services.run_repository import RunRepository
from src.services.pipeline import RunRegistry, start_run
from src.services.storage import workspace_exists

router = APIRouter(tags=["history"])


class RunListItem(BaseModel):
    """Summary of a run for list views."""
    run_id: str
    question: str
    created_at: str
    status: Literal["complete", "failed"]
    document_count: int
    positive_hits: int


class RunListResponse(BaseModel):
    """Paginated list of runs."""
    runs: list[RunListItem]
    total: int
    limit: int
    offset: int


class RunConfigSnapshot(BaseModel):
    """Config used for a historical run."""
    provider: str
    model: str
    max_chunk_tokens: int
    context_window_tokens: int


class Citation(BaseModel):
    """A citation in the result."""
    doc_id: str
    chunk_id: str
    quote: str
    page_marker: str
    heading_path: str


class TokenUsage(BaseModel):
    """Token usage for a run."""
    input_tokens: int
    output_tokens: int


class RunResult(BaseModel):
    """The result of a completed run."""
    final_answer: str
    citations: list[Citation]
    token_usage: dict[str, TokenUsage | None]


class RunDetailResponse(BaseModel):
    """Full details of a historical run."""
    run_id: str
    workspace_id: str
    doc_id: str | None
    question: str
    created_at: str
    completed_at: str
    status: str
    config_snapshot: RunConfigSnapshot
    result: RunResult | None
    pool: list[dict]


class RerunResponse(BaseModel):
    """Response from a rerun request."""
    run_id: str
    message: str


class ClearRunsResponse(BaseModel):
    """Response from clearing runs."""
    deleted: int


@router.get("/workspaces/{ws_id}/runs", response_model=RunListResponse)
async def list_runs(
    ws_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List historical runs for a workspace.
    
    Returns paginated list sorted by creation time (newest first).
    """
    # Verify workspace exists
    if not workspace_exists(ws_id):
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    runs, total = RunRepository.list_for_workspace(ws_id, limit, offset)
    
    return {
        "runs": runs,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/workspaces/{ws_id}/runs/{run_id}", response_model=RunDetailResponse)
async def get_run(ws_id: str, run_id: str):
    """
    Get full details of a historical run.
    
    Includes the question, answer, citations, pool hits, and config snapshot.
    """
    # Verify workspace exists
    if not workspace_exists(ws_id):
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    run = RunRepository.load(ws_id, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    return {
        "run_id": run.run_id,
        "workspace_id": run.workspace_id,
        "doc_id": run.doc_id,
        "question": run.question,
        "created_at": run.created_at,
        "completed_at": run.completed_at or run.created_at,
        "status": run.status,
        "config_snapshot": run.config_snapshot,
        "result": run.result,
        "pool": run.pool,
    }


@router.delete("/workspaces/{ws_id}/runs/{run_id}", status_code=204)
async def delete_run(ws_id: str, run_id: str):
    """
    Delete a specific run from history.
    
    This action cannot be undone.
    """
    # Verify workspace exists
    if not workspace_exists(ws_id):
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    if not RunRepository.delete(ws_id, run_id):
        raise HTTPException(status_code=404, detail="Run not found")
    
    return None


@router.delete("/workspaces/{ws_id}/runs", response_model=ClearRunsResponse)
async def clear_workspace_runs(ws_id: str):
    """
    Delete all runs for a workspace.
    
    This action cannot be undone.
    """
    # Verify workspace exists
    if not workspace_exists(ws_id):
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    count = RunRepository.clear_workspace(ws_id)
    return {"deleted": count}


@router.post("/workspaces/{ws_id}/runs/{run_id}/rerun", response_model=RerunResponse)
async def rerun_query(
    ws_id: str,
    run_id: str,
    background_tasks: BackgroundTasks,
):
    """
    Re-run the same question against current documents.
    
    Creates a new run with the same question and document scope as the historical run.
    Uses current documents and settings (not the historical snapshot).
    """
    # Verify workspace exists
    if not workspace_exists(ws_id):
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Load the historical run
    run = RunRepository.load(ws_id, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Create new run with same parameters
    new_run_id = RunRegistry.create(ws_id, run.doc_id, run.question)
    
    # Start the pipeline in background
    # Note: We use default values for ocr_enabled and eml_scope
    # In future, these could be stored in the run snapshot
    background_tasks.add_task(
        start_run,
        run_id=new_run_id,
        workspace_id=ws_id,
        doc_id=run.doc_id,
        question=run.question,
        ocr_enabled=False,
        eml_scope="both",
        system_prompt_extra=None,
    )
    
    return {
        "run_id": new_run_id,
        "message": "Query re-run started",
    }
