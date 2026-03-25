import asyncio
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from src.services.pipeline import RunRegistry, start_run
from src.services.report import build_report, build_html_report

router = APIRouter(tags=["query"])


class QueryRequest(BaseModel):
    workspace_id: str
    doc_id: str | None = None
    question: str
    ocr_enabled: bool = False
    eml_scope: Literal["body", "attachments", "both"] = "both"
    system_prompt_extra: str | None = None


@router.post("/query", status_code=202)
async def create_query_run(body: QueryRequest, background_tasks: BackgroundTasks):
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="question is required")

    run_id = RunRegistry.create(body.workspace_id, body.doc_id, body.question)
    background_tasks.add_task(
        start_run,
        run_id=run_id,
        workspace_id=body.workspace_id,
        doc_id=body.doc_id,
        question=body.question,
        ocr_enabled=body.ocr_enabled,
        eml_scope=body.eml_scope,
        system_prompt_extra=body.system_prompt_extra,
    )
    return {"run_id": run_id}


@router.get("/query/{run_id}/result")
async def get_result(run_id: str):
    run = RunRegistry.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    if run["status"] in ("pending", "scanning", "synthesizing"):
        return JSONResponse(status_code=202, content={"status": run["status"]})

    if run["status"] == "failed":
        return JSONResponse(status_code=500, content={"status": "failed", "error": run.get("error")})

    return run["result"]


@router.get("/query/{run_id}/report")
async def get_report(run_id: str):
    run = RunRegistry.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    if run["status"] != "complete":
        raise HTTPException(status_code=409, detail=f"Run is not complete (status: {run['status']})")

    report = build_report(run)
    from fastapi.responses import Response
    import json
    return Response(
        content=json.dumps(report, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="report-{run_id}.json"'},
    )


@router.get("/query/{run_id}/report/html")
async def get_report_html(run_id: str):
    run = RunRegistry.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    if run["status"] != "complete":
        raise HTTPException(status_code=409, detail=f"Run is not complete (status: {run['status']})")

    from fastapi.responses import Response
    return Response(
        content=build_html_report(run),
        media_type="text/html",
        headers={"Content-Disposition": f'attachment; filename="report-{run_id}.html"'},
    )
