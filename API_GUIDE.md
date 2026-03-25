# Context Pool — API Developer Guide

Base URL: `http://localhost:8000`
Interactive docs (Swagger UI): `http://localhost:8000/docs`

---

## Workflow Overview

Every API session follows this sequence:

```
1. Create workspace        →  workspace_id
2. Upload documents        →  doc_id(s)
3. POST /api/query         →  run_id
4. Poll /api/query/{run_id}/result   (or track via WebSocket)
5. GET  /api/query/{run_id}/report   (download full JSON report)
```

---

## 1. Workspaces

### Create a workspace

```http
POST /api/workspaces
Content-Type: application/json
```

```json
{ "name": "Legal Review Q1" }
```

**Response `201`:**

```json
{
  "workspace_id": "ws_abc123",
  "name": "Legal Review Q1",
  "created_at": "2026-03-09T10:00:00Z"
}
```

### List workspaces

```http
GET /api/workspaces
```

**Response `200`:**

```json
{
  "workspaces": [
    { "workspace_id": "ws_abc123", "name": "Legal Review Q1", "created_at": "..." }
  ]
}
```

### Delete a workspace

```http
DELETE /api/workspaces/{ws_id}
```

**Response `204` — no body.**

---

## 2. Documents

### Upload documents

Multipart form upload. Multiple files can be sent in a single request.

```http
POST /api/workspaces/{ws_id}/documents
Content-Type: multipart/form-data
```

| Supported types | `.pdf` `.docx` `.txt` `.md` `.html` `.htm` `.eml` `.png` `.jpg` `.jpeg` |
|---|---|

**Response `201`:**

```json
{
  "documents": [
    { "doc_id": "doc_xyz789", "filename": "contract.pdf", "size_bytes": 204800 },
    { "doc_id": "doc_xyz790", "filename": "addendum.docx", "size_bytes": 51200 }
  ]
}
```

### List documents

```http
GET /api/workspaces/{ws_id}/documents
```

### Delete a document

```http
DELETE /api/workspaces/{ws_id}/documents/{doc_id}
```

**Response `204` — no body.**

---

## 3. Running a Query

### Start a query run

```http
POST /api/query
Content-Type: application/json
```

```json
{
  "workspace_id": "ws_abc123",
  "question": "What are the termination clauses?",
  "doc_id": null,
  "ocr_enabled": false,
  "eml_scope": "both",
  "system_prompt_extra": null
}
```

**Request fields:**

| Field | Type | Default | Description |
|---|---|---|---|
| `workspace_id` | string | required | Target workspace |
| `question` | string | required | The question to answer |
| `doc_id` | string \| null | `null` | Scope to one document, or `null` for all docs in the workspace |
| `ocr_enabled` | boolean | `false` | Enable OCR for scanned PDFs and images |
| `eml_scope` | string | `"both"` | For `.eml` files: `"body"`, `"attachments"`, or `"both"` |
| `system_prompt_extra` | string \| null | `null` | Additional system instructions appended to both the chunk-scanning and synthesis prompts (see [System Instructions](#5-system-instructions)) |

**Response `202`:**

```json
{ "run_id": "550e8400-e29b-41d4-a716-446655440000" }
```

The run executes asynchronously in the background. Use the `run_id` to poll for the result.

---

### Poll for result

```http
GET /api/query/{run_id}/result
```

| Run state | HTTP | Body |
|---|---|---|
| In progress | `202` | `{ "status": "pending" \| "scanning" \| "synthesizing" }` |
| Complete | `200` | Full result (see below) |
| Failed | `500` | `{ "status": "failed", "error": "..." }` |

**Successful result (`200`):**

```json
{
  "final_answer": "Either party may terminate the contract with 30 days written notice (Section 12.3).",
  "citations": [
    {
      "doc_id": "doc_xyz789",
      "chunk_id": "chunk_14",
      "quote": "Either party may terminate with 30 days written notice",
      "page_marker": "p.8",
      "heading_path": "Section 12 > Termination"
    }
  ],
  "token_usage": {
    "scan_total": { "input_tokens": 48200, "output_tokens": 3100 },
    "synthesis": { "input_tokens": 1800, "output_tokens": 420 },
    "overall": { "input_tokens": 50000, "output_tokens": 3520 }
  }
}
```

---

### Download reports

**JSON report** (downloadable file):

```http
GET /api/query/{run_id}/report
```

Returns `application/json` — `Content-Disposition: attachment; filename="report-{run_id}.json"`.

**HTML report** (self-contained HTML file):

```http
GET /api/query/{run_id}/report/html
```

Both endpoints return `409` if the run is not yet complete.

---

## 4. Real-Time Progress via WebSocket

Connect immediately after receiving the `run_id`. The server replays any already-buffered events for late-joining clients.

```
WS ws://localhost:8000/ws/query/{run_id}
```

### Event types

```jsonc
// Emitted for each chunk processed during the scan phase
{ "type": "chunk_progress", "current": 42, "total": 150 }

// Synthesis phase has started
{ "type": "synthesis_started" }

// Run finished — fetch the result from REST
{ "type": "synthesis_finished" }

// Pipeline aborted — run status is "failed"
{ "type": "error", "message": "LLM returned invalid JSON for chunk_07: ..." }
```

The connection closes automatically when the run reaches `complete` or `failed`.

---

## 5. System Instructions

The `system_prompt_extra` field lets you inject custom instructions into the LLM system prompt for every call in a run. It is appended — separated by a blank line — after the core JSON-enforcement instructions in **both** processing phases:

**Chunk scanning phase** (runs once per chunk):
```
[core] You are a strict extractive answer engine. Answer ONLY from the
       provided document chunk. Respond with JSON or {}. ...

[your extra] Only consider clauses explicitly marked as BINDING.
```

**Synthesis phase** (runs once per run):
```
[core] You are a synthesis engine. Produce a final answer as strict JSON. ...

[your extra] Only consider clauses explicitly marked as BINDING.
```

> **Important:** Your extra instructions are appended after the core JSON contract, so they can influence language, tone, domain filtering, and reasoning — but they cannot override the required JSON output format.

### Practical examples

```json
{ "system_prompt_extra": "Respond in French regardless of the document language." }
```

```json
{ "system_prompt_extra": "This document is governed by German law. Use formal register." }
```

```json
{ "system_prompt_extra": "Only consider sections explicitly labelled BINDING or MANDATORY." }
```

```json
{ "system_prompt_extra": "Answers will be read by non-lawyers. Avoid legal jargon and explain terms plainly." }
```

```json
{ "system_prompt_extra": "When referencing monetary amounts always include the original currency symbol from the document." }
```

---

## 6. Settings

### Get current configuration

```http
GET /api/settings
```

> The API key value is never returned — `api_key_set` indicates whether one is configured.

**Response `200`:**

```json
{
  "provider": "anthropic",
  "api_key_set": true,
  "model": "claude-sonnet-4-6",
  "context_window_tokens": 200000,
  "max_chunk_tokens": 24000,
  "timeouts": {
    "chunk_call_seconds": 60,
    "synthesis_seconds": 120
  },
  "temperatures": {
    "scanning": 0.1,
    "synthesis": 0.2
  },
  "ollama_base_url": "http://host.docker.internal:11434"
}
```

### Update settings

All fields are optional — include only what you want to change. Changes are written to `config.yaml` and take effect immediately for the next query run.

```http
PATCH /api/settings
Content-Type: application/json
```

```json
{
  "provider": "anthropic",
  "api_key": "sk-ant-...",
  "model": "claude-opus-4-6",
  "max_chunk_tokens": 16000,
  "temperatures": { "scanning": 0.0, "synthesis": 0.1 }
}
```

**Response `200`:** `{ "ok": true }`

---

## 7. Error Responses

All errors return a JSON body:

```json
{ "error": "Human-readable description" }
```

FastAPI validation errors return:

```json
{ "detail": "..." }
```

| HTTP | Cause |
|---|---|
| `400` | Empty `question` or `name` |
| `404` | Workspace or document not found |
| `409` | Report requested before run is complete |
| `422` | Unsupported file type or request validation failure |
| `500` | LLM error, parse failure, or pipeline abort |

---

## 8. Code Examples

### Python — full end-to-end

```python
import time
import requests

BASE = "http://localhost:8000/api"

# 1. Create workspace
ws = requests.post(f"{BASE}/workspaces", json={"name": "Demo"}).json()
ws_id = ws["workspace_id"]

# 2. Upload a document
with open("contract.pdf", "rb") as f:
    doc = requests.post(
        f"{BASE}/workspaces/{ws_id}/documents",
        files={"files": ("contract.pdf", f, "application/pdf")},
    ).json()
doc_id = doc["documents"][0]["doc_id"]

# 3. Start a query with custom system instructions
run = requests.post(f"{BASE}/query", json={
    "workspace_id": ws_id,
    "question": "What are the payment terms?",
    "system_prompt_extra": "Respond in plain English suitable for a non-lawyer.",
}).json()
run_id = run["run_id"]

# 4. Poll until done
while True:
    r = requests.get(f"{BASE}/query/{run_id}/result")
    if r.status_code == 200:
        result = r.json()
        break
    if r.status_code == 500:
        raise RuntimeError(r.json()["error"])
    time.sleep(2)

print(result["final_answer"])
for c in result["citations"]:
    print(f"  [{c['doc_id']}] {c['quote']}  ({c.get('page_marker', '')})")

# 5. Save the JSON report
report = requests.get(f"{BASE}/query/{run_id}/report")
with open(f"report-{run_id}.json", "wb") as f:
    f.write(report.content)
```

---

### Python — WebSocket progress tracking

```python
import asyncio
import json
import requests
import websockets

BASE_HTTP = "http://localhost:8000/api"
BASE_WS   = "ws://localhost:8000/ws"


async def run_with_progress(ws_id: str, question: str, system_prompt_extra: str | None = None):
    run = requests.post(f"{BASE_HTTP}/query", json={
        "workspace_id": ws_id,
        "question": question,
        "system_prompt_extra": system_prompt_extra,
    }).json()
    run_id = run["run_id"]

    async with websockets.connect(f"{BASE_WS}/query/{run_id}") as ws:
        async for message in ws:
            event = json.loads(message)
            if event["type"] == "chunk_progress":
                pct = event["current"] / event["total"] * 100
                print(f"\rScanning {pct:.0f}%  ({event['current']}/{event['total']})", end="", flush=True)
            elif event["type"] == "synthesis_started":
                print("\nSynthesizing...")
            elif event["type"] == "synthesis_finished":
                print("Done.")
                break
            elif event["type"] == "error":
                raise RuntimeError(event["message"])

    return requests.get(f"{BASE_HTTP}/query/{run_id}/result").json()


result = asyncio.run(run_with_progress(
    ws_id="ws_abc123",
    question="What penalties apply for late payment?",
    system_prompt_extra="Highlight any specific percentages or fixed amounts.",
))
print(result["final_answer"])
```

---

### curl — quick test

```bash
# 1. Create workspace
WS=$(curl -s -X POST http://localhost:8000/api/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}' | jq -r .workspace_id)

# 2. Upload document
DOC=$(curl -s -X POST "http://localhost:8000/api/workspaces/$WS/documents" \
  -F "files=@contract.pdf" | jq -r '.documents[0].doc_id')

# 3. Start query
RUN=$(curl -s -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d "{
    \"workspace_id\": \"$WS\",
    \"question\": \"Summarize the key obligations of each party\",
    \"system_prompt_extra\": \"Use bullet points in the final_answer field.\"
  }" | jq -r .run_id)

# 4. Poll for result
curl -s "http://localhost:8000/api/query/$RUN/result" | jq .

# 5. Download report
curl -s "http://localhost:8000/api/query/$RUN/report" -o "report-$RUN.json"
```
