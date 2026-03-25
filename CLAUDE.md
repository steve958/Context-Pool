# Context Pool — CLAUDE.md

## Project Overview

Context Pool is a self-hosted document Q&A tool that answers questions over user-provided documents **without embeddings or vector databases**. It performs a sequential, exhaustive scan across document chunks using a single user-selected LLM. Positive chunk hits are pooled and synthesized into a final JSON answer with citations.

**Deployment:** Docker Desktop via `docker-compose up`
**Users:** Non-developers (UI) and developers (REST API + WebSocket)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, Uvicorn |
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| OCR | Tesseract (via pytesseract + pdf2image) |
| LLM Providers | OpenAI, Anthropic, Google Gemini, Ollama |
| Containerisation | Docker Desktop, docker-compose |
| Package managers | pip (backend), npm (frontend) |

---

## Repository Structure

```
context-pool/
├── CLAUDE.md                  ← you are here
├── docker-compose.yml
├── .gitignore
├── config.example.yaml        ← copy to /data/config/config.yaml
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/
│       ├── main.py            ← FastAPI app factory + lifespan
│       ├── config.py          ← YAML config loader & schema
│       ├── routers/
│       │   ├── workspaces.py  ← POST/GET /api/workspaces
│       │   ├── documents.py   ← POST/GET/DELETE /api/workspaces/{id}/documents
│       │   ├── query.py       ← POST /api/query, GET result/report
│       │   ├── settings.py    ← GET/PATCH /api/settings
│       │   └── ws.py          ← WS /ws/query/{run_id}
│       ├── services/
│       │   ├── storage.py     ← file + metadata layer (docker volume)
│       │   ├── pipeline.py    ← run orchestrator (parse→chunk→scan→synthesize)
│       │   ├── chunker.py     ← heading-based + token-window splitting
│       │   └── report.py      ← JSON report builder
│       ├── parsers/
│       │   ├── pdf.py         ← text-based PDF → Markdown + page markers
│       │   ├── ocr.py         ← scanned PDF + image OCR (pytesseract)
│       │   ├── docx.py        ← DOCX → Markdown
│       │   ├── html.py        ← HTML → Markdown
│       │   ├── eml.py         ← EML → Markdown (body + attachments)
│       │   ├── txt.py         ← TXT/MD passthrough normalizer
│       │   └── normalize.py   ← unified post-processing for all parsers
│       └── connectors/
│           ├── base.py        ← LLMConnector abstract base class
│           ├── openai.py
│           ├── anthropic.py
│           ├── gemini.py
│           └── ollama.py
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.ts
    ├── tsconfig.json
    ├── tailwind.config.ts
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx               ← redirect to /workspaces
        │   ├── globals.css
        │   ├── workspaces/
        │   │   └── page.tsx           ← workspace selector
        │   └── workspace/[id]/
        │       ├── page.tsx           ← redirect to /documents
        │       ├── documents/page.tsx ← upload & list
        │       ├── ask/page.tsx       ← ask question
        │       ├── settings/page.tsx  ← provider config
        │       └── run/[runId]/
        │           ├── page.tsx       ← progress bar
        │           ├── results/page.tsx
        │           └── inspect/page.tsx
        ├── components/
        │   ├── ui/                    ← primitives (Button, Input, Card, Badge…)
        │   └── domain/                ← WorkspaceCard, CitationList, ChunkViewer…
        └── lib/
            ├── api.ts                 ← typed fetch wrappers for REST endpoints
            └── ws.ts                  ← WebSocket hook
```

---

## Running Locally

```bash
# 1. Copy and edit config
cp config.example.yaml ./backend/data/config/config.yaml
# (edit config.yaml with your provider and API key)

# 2. Start everything
docker-compose up --build

# UI  → http://localhost:3000
# API → http://localhost:8000
# API docs → http://localhost:8000/docs
```

### Local development (without Docker)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev   # → http://localhost:3000
```

---

## Key Architectural Rules

1. **Sequential scan only** — chunks are processed one at a time, in order. No parallelism, no early stopping, no prefiltering.
2. **Strict extractive output** — the per-chunk prompt must enforce JSON `{has_answer, answer, evidence_quotes[]}` or `{}`. Never accept free-text chunk responses.
3. **Fail-fast** — any provider error during a run aborts the entire run immediately. Do not swallow errors.
4. **No persistence of intermediate data** — parsed markdown, chunks, and pooled answers are in-memory only. Only the downloaded JSON report is a durable artifact.
5. **One model for everything** — the same provider/model is used for both chunk scanning and final synthesis.
6. **Query-time parsing** — documents are parsed fresh for every query run. No caching.

---

## API Summary

### REST
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/workspaces` | Create workspace |
| GET | `/api/workspaces` | List workspaces |
| POST | `/api/workspaces/{id}/documents` | Upload documents |
| GET | `/api/workspaces/{id}/documents` | List documents |
| DELETE | `/api/workspaces/{id}/documents/{doc_id}` | Delete document |
| POST | `/api/query` | Start query run → `{run_id}` |
| GET | `/api/query/{run_id}/result` | Get final result |
| GET | `/api/query/{run_id}/report` | Download JSON report |
| GET | `/api/settings` | Get current config (no key) |
| PATCH | `/api/settings` | Update config |

### WebSocket
| Path | Events |
|---|---|
| `WS /ws/query/{run_id}` | `chunk_progress`, `synthesis_started`, `synthesis_finished`, `error` |

---

## Chunk Scan JSON Contract

**Positive hit:**
```json
{ "has_answer": true, "answer": "...", "evidence_quotes": ["..."] }
```
**No hit:**
```json
{}
```

## Final Synthesis JSON Contract

```json
{
  "final_answer": "...",
  "citations": [
    { "doc_id": "...", "chunk_id": "...", "quote": "...", "page_marker": "...", "heading_path": "..." }
  ]
}
```

---

## Supported File Types

| Type | Parser | OCR required |
|---|---|---|
| PDF (text) | `parsers/pdf.py` | No |
| PDF (scanned) | `parsers/ocr.py` | Yes (opt-in) |
| DOCX | `parsers/docx.py` | No |
| TXT / MD | `parsers/txt.py` | No |
| HTML | `parsers/html.py` | No |
| EML | `parsers/eml.py` | No |
| PNG / JPG | `parsers/ocr.py` | Yes (opt-in) |

---

## LLM Provider Config

Configured via `/data/config/config.yaml` (mounted docker volume). API keys support `ENV:VAR_NAME` interpolation.

Supported providers: `openai`, `anthropic`, `google`, `ollama`

---

## Code Conventions

- **Backend:** snake_case for files, functions, variables. Type hints on all function signatures. Pydantic models for all request/response schemas.
- **Frontend:** PascalCase for components, camelCase for variables/functions. All components are TypeScript. No `any` types.
- **UI style:** Minimalistic, clean. Dark/light mode via Tailwind. No external component library — build primitives in `src/components/ui/`.
- **Errors:** Backend always returns `{"error": "message"}` JSON on failure. Frontend shows inline error states, never silent failures.
