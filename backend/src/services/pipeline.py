"""
Run pipeline orchestrator.

State machine: pending → scanning → synthesizing → complete | failed
"""

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket

from src.config import get_config


# ── Run Registry ──────────────────────────────────────────────────────────────

class RunRegistry:
    _runs: dict[str, dict] = {}
    _clients: dict[str, list[WebSocket]] = {}
    _events: dict[str, list[dict]] = {}

    @classmethod
    def create(cls, workspace_id: str, doc_id: str | None, question: str) -> str:
        run_id = str(uuid.uuid4())
        cls._runs[run_id] = {
            "run_id": run_id,
            "workspace_id": workspace_id,
            "doc_id": doc_id,
            "question": question,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "result": None,
            "error": None,
        }
        cls._clients[run_id] = []
        cls._events[run_id] = []
        return run_id

    @classmethod
    def get(cls, run_id: str) -> dict | None:
        return cls._runs.get(run_id)

    @classmethod
    def update(cls, run_id: str, **kwargs):
        if run_id in cls._runs:
            cls._runs[run_id].update(kwargs)

    @classmethod
    def add_client(cls, run_id: str, ws: WebSocket):
        cls._clients.setdefault(run_id, []).append(ws)

    @classmethod
    def remove_client(cls, run_id: str, ws: WebSocket):
        if run_id in cls._clients:
            cls._clients[run_id] = [c for c in cls._clients[run_id] if c is not ws]

    @classmethod
    def get_buffered_events(cls, run_id: str) -> list[dict]:
        return cls._events.get(run_id, [])

    @classmethod
    async def emit(cls, run_id: str, event: dict):
        cls._events.setdefault(run_id, []).append(event)
        dead = []
        for ws in cls._clients.get(run_id, []):
            try:
                await ws.send_json(event)
            except Exception:
                dead.append(ws)
        for ws in dead:
            cls.remove_client(run_id, ws)

    @classmethod
    def cleanup_old_runs(cls, max_age_seconds: int = 86400):
        """Remove completed/failed/cancelled runs older than max_age_seconds (default 24 h)."""
        now = datetime.now(timezone.utc)
        stale = [
            run_id
            for run_id, run in list(cls._runs.items())
            if run.get("status") in ("complete", "failed", "cancelled")
            and (now - datetime.fromisoformat(run["created_at"])).total_seconds() > max_age_seconds
        ]
        for run_id in stale:
            cls._runs.pop(run_id, None)
            cls._clients.pop(run_id, None)
            cls._events.pop(run_id, None)


# ── Pipeline ──────────────────────────────────────────────────────────────────

async def start_run(
    run_id: str,
    workspace_id: str,
    doc_id: str | None,
    question: str,
    ocr_enabled: bool,
    eml_scope: str,
    system_prompt_extra: str | None = None,
):
    try:
        await _run_pipeline(run_id, workspace_id, doc_id, question, ocr_enabled, eml_scope, system_prompt_extra)
    except Exception as exc:
        RunRegistry.update(run_id, status="failed", error=str(exc))
        await RunRegistry.emit(run_id, {"type": "error", "message": str(exc)})


async def _run_pipeline(
    run_id: str,
    workspace_id: str,
    doc_id: str | None,
    question: str,
    ocr_enabled: bool,
    eml_scope: str,
    system_prompt_extra: str | None = None,
):
    from src.services.storage import get_all_document_paths, get_document_path
    from src.parsers.normalize import normalize
    from src.services.chunker import chunk_markdown
    from src.connectors.base import get_connector

    cfg = get_config()
    connector = get_connector(cfg)

    # 1. Resolve documents to process
    if doc_id:
        path = get_document_path(workspace_id, doc_id)
        if not path:
            raise RuntimeError(f"Document {doc_id} not found in workspace {workspace_id}")
        doc_paths = [(doc_id, path)]
    else:
        doc_paths = get_all_document_paths(workspace_id)

    if not doc_paths:
        raise RuntimeError("No documents found in the selected scope.")

    # 2. Parse + normalize all documents
    # chunk_markdown calls connector.count_tokens() synchronously (HTTP for Ollama),
    # so run it in a thread to avoid blocking the asyncio event loop.
    all_chunks: list[dict] = []
    for d_id, path in doc_paths:
        markdown = _parse_document(path, ocr_enabled, eml_scope)
        normalized = normalize(markdown)
        chunks = await asyncio.to_thread(chunk_markdown, normalized, d_id, cfg.max_chunk_tokens, connector)
        all_chunks.extend(chunks)

    if not all_chunks:
        raise RuntimeError("No content chunks were produced from the selected documents.")

    # 3. Sequential chunk scanning
    RunRegistry.update(run_id, status="scanning")
    pool: list[dict] = []
    total = len(all_chunks)
    token_scan_total: dict = {}

    for i, chunk in enumerate(all_chunks):
        hit, usage = await _scan_chunk(connector, question, chunk, cfg, system_prompt_extra)
        _merge_usage(token_scan_total, usage)

        if hit:
            pool.append({**hit, "chunk_id": chunk["chunk_id"], "doc_id": chunk["doc_id"],
                         "heading_path": chunk.get("heading_path"), "page_marker": chunk.get("page_marker")})

        await RunRegistry.emit(run_id, {"type": "chunk_progress", "current": i + 1, "total": total})

    # 4. Synthesis
    RunRegistry.update(run_id, status="synthesizing")
    await RunRegistry.emit(run_id, {"type": "synthesis_started"})

    final_result, synthesis_usage = await _synthesize(connector, question, pool, cfg, system_prompt_extra)

    token_usage = {
        "scan_total": token_scan_total or None,
        "synthesis": synthesis_usage or None,
        "overall": _sum_usage(token_scan_total, synthesis_usage),
    }

    result = {**final_result, "token_usage": token_usage}
    RunRegistry.update(run_id, status="complete", result=result)
    await RunRegistry.emit(run_id, {"type": "synthesis_finished"})


def _parse_document(path, ocr_enabled: bool, eml_scope: str) -> str:
    from src.parsers import pdf, ocr, docx, html, eml, txt

    suffix = path.suffix.lower()
    content = path.read_bytes()

    if suffix == ".pdf":
        if ocr_enabled:
            return ocr.parse_pdf(content)
        return pdf.parse(content)
    elif suffix == ".docx":
        return docx.parse(content)
    elif suffix in (".html", ".htm"):
        return html.parse(content)
    elif suffix == ".eml":
        return eml.parse(content, scope=eml_scope, ocr_enabled=ocr_enabled)
    elif suffix in (".png", ".jpg", ".jpeg"):
        if ocr_enabled:
            return ocr.parse_image(content)
        raise RuntimeError(f"Image files require OCR to be enabled.")
    else:
        return txt.parse(content)


async def _scan_chunk(connector, question: str, chunk: dict, cfg, system_prompt_extra: str | None = None) -> tuple[dict | None, dict]:
    import json

    system = (
        "You are a strict extractive answer engine. "
        "Answer ONLY from the provided document chunk. "
        "If the chunk contains relevant information, respond with valid JSON: "
        '{"has_answer": true, "answer": "<answer>", "evidence_quotes": ["<exact substring from chunk>", ...]}. '
        "If the chunk does NOT contain relevant information, respond with exactly: {}. "
        "Do not add any explanation outside the JSON."
    )
    if system_prompt_extra:
        system = system + "\n\n" + system_prompt_extra
    prompt = f"Question: {question}\n\nChunk:\n{chunk['text']}"

    text, usage = await connector.complete(
        prompt=prompt,
        system=system,
        temperature=cfg.temperatures.scanning,
        timeout=cfg.timeouts.chunk_call_seconds,
    )

    text = _strip_code_fence(text)
    if not text or text == "{}":
        return None, usage

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        # Non-compliant response for a single chunk — treat as no hit and continue.
        return None, usage

    if not isinstance(parsed, dict) or not parsed.get("has_answer"):
        return None, usage

    # Normalize missing evidence_quotes — small local models sometimes omit them
    if not parsed.get("evidence_quotes"):
        parsed["evidence_quotes"] = []
    return parsed, usage


async def _synthesize(connector, question: str, pool: list[dict], cfg, system_prompt_extra: str | None = None) -> tuple[dict, dict]:
    import json

    if not pool:
        return {
            "final_answer": "No relevant information was found in the documents for this question.",
            "citations": [],
        }, {}

    pool_text = "\n\n".join(
        f"[Chunk {i+1} | chunk_id:{h['chunk_id']} | doc:{h['doc_id']} | {h.get('heading_path','')} | {h.get('page_marker','')}]\n"
        f"Answer: {h['answer']}\nEvidence: {h['evidence_quotes']}"
        for i, h in enumerate(pool)
    )

    system = (
        "You are a synthesis engine. Given pooled evidence from document chunks, "
        "produce a final answer as strict JSON: "
        '{"final_answer": "<answer>", "citations": [{"doc_id": "", "chunk_id": "", "quote": "", "page_marker": "", "heading_path": ""}]}. '
        "Base your answer only on the provided evidence. "
        "If evidence is limited, label uncertainty clearly in final_answer. "
        "Do not invent unsupported claims."
    )
    if system_prompt_extra:
        system = system + "\n\n" + system_prompt_extra
    prompt = f"Question: {question}\n\nPooled evidence:\n{pool_text}"

    text, usage = await connector.complete(
        prompt=prompt,
        system=system,
        temperature=cfg.temperatures.synthesis,
        timeout=cfg.timeouts.synthesis_seconds,
    )

    try:
        result = json.loads(_strip_code_fence(text))
    except json.JSONDecodeError:
        raise RuntimeError(f"Synthesis returned invalid JSON: {text[:300]}")

    # Post-process citations: fill authoritative metadata from the pool.
    # The LLM often gets UUIDs wrong or returns empty citations, so we fix
    # doc_id/page_marker/heading_path from the pool and fall back to pool
    # entries when the LLM omits citations entirely.
    pool_map = {h["chunk_id"]: h for h in pool}
    citations = result.get("citations") or []

    def _best_quote(c_quote: str, hit: dict) -> str:
        return (
            c_quote
            or (hit["evidence_quotes"][0] if hit.get("evidence_quotes") else "")
            or hit.get("answer", "")
        )

    enriched = []
    for c in citations:
        chunk_id = c.get("chunk_id", "")
        hit = pool_map.get(chunk_id)
        if hit:
            enriched.append({
                "doc_id": hit["doc_id"],
                "chunk_id": chunk_id,
                "quote": _best_quote(c.get("quote", ""), hit),
                "page_marker": hit.get("page_marker") or "",
                "heading_path": hit.get("heading_path") or "",
            })

    # If the LLM produced no usable citations, fall back to all pool entries.
    if not enriched:
        enriched = [
            {
                "doc_id": h["doc_id"],
                "chunk_id": h["chunk_id"],
                "quote": (h["evidence_quotes"][0] if h.get("evidence_quotes") else "") or h.get("answer", ""),
                "page_marker": h.get("page_marker") or "",
                "heading_path": h.get("heading_path") or "",
            }
            for h in pool
        ]

    result["citations"] = enriched
    return result, usage


def _strip_code_fence(text: str) -> str:
    """Normalise LLM JSON output: strip markdown fences and curly/smart quotes."""
    import re
    text = text.strip()
    # Remove markdown code fences (```json ... ``` or ``` ... ```)
    if text.startswith("```"):
        newline = text.find("\n")
        text = text[newline + 1:] if newline != -1 else text[3:]
        if text.endswith("```"):
            text = text[:-3]
    text = text.strip()
    # Replace typographic/curly quotes with straight ASCII quotes.
    # Small models frequently emit these, making json.loads fail.
    text = text.replace("\u201c", '"').replace("\u201d", '"')  # " "
    text = text.replace("\u2018", "'").replace("\u2019", "'")  # ' '
    # If the text doesn't start with a JSON object, try to extract one.
    # Local models sometimes emit prose or markdown around the JSON.
    if text and not text.startswith(("{", "[")):
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            text = match.group().strip()
    return text


def _merge_usage(total: dict, usage: dict):
    for k, v in usage.items():
        if isinstance(v, (int, float)):
            total[k] = total.get(k, 0) + v


def _sum_usage(a: dict, b: dict) -> dict | None:
    if not a and not b:
        return None
    result = dict(a)
    for k, v in b.items():
        if isinstance(v, (int, float)):
            result[k] = result.get(k, 0) + v
    return result or None
