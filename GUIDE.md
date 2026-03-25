# Context Pool — Complete User Guide

> **Self-hosted document Q&A without embeddings.**
> Ask questions across any set of documents. Every chunk is checked. Every answer is cited.

---

## Table of Contents

1. [What is Context Pool?](#1-what-is-context-pool)
2. [How It Works](#2-how-it-works)
3. [Quick Start (Docker)](#3-quick-start-docker)
4. [Local Development Setup](#4-local-development-setup)
5. [Configuring a Provider](#5-configuring-a-provider)
6. [Step-by-Step UI Walkthrough](#6-step-by-step-ui-walkthrough)
   - [Create a Workspace](#61-create-a-workspace)
   - [Upload Documents](#62-upload-documents)
   - [Ask a Question](#63-ask-a-question)
   - [Reading the Results](#64-reading-the-results)
   - [Inspecting Chunks](#65-inspecting-chunks)
   - [Downloading a Report](#66-downloading-a-report)
7. [Advanced Query Options](#7-advanced-query-options)
8. [Settings Reference](#8-settings-reference)
9. [Supported File Types](#9-supported-file-types)
10. [Security & Production Setup](#10-security--production-setup)
11. [REST API Reference](#11-rest-api-reference)
12. [WebSocket Reference](#12-websocket-reference)
13. [Understanding Token Usage](#13-understanding-token-usage)
14. [Troubleshooting](#14-troubleshooting)
15. [FAQ](#15-faq)

---

## 1. What is Context Pool?

Context Pool is a **self-hosted, open-source document Q&A tool** that answers questions over your documents without embeddings, vector databases, or any cloud dependency beyond the LLM provider of your choice.

### Key properties

| Property | Description |
|---|---|
| **Exhaustive** | Every chunk of every document is scanned — nothing is skipped via semantic search shortcuts |
| **Extractive** | Answers are grounded in verbatim evidence quotes from the source material |
| **Cited** | Every claim in the final answer links back to a specific chunk, document, page, and heading |
| **Self-hosted** | Runs entirely on your machine via Docker. Documents never leave your infrastructure |
| **Provider-agnostic** | Works with OpenAI, Anthropic, Google Gemini, and Ollama (local models) |
| **No vector DB** | No setup beyond a YAML config file — no Pinecone, Weaviate, or Chroma required |

### When to use Context Pool

- **Contract review** — find every clause mentioning a specific topic across dozens of agreements
- **Research** — extract evidence from PDFs, papers, or reports with full citations
- **Due diligence** — scan financial disclosures, technical specs, or compliance documents
- **Email discovery** — search `.eml` archives including attachments
- **OCR documents** — query scanned PDFs and images with built-in OCR support
- **Sensitive data** — keep documents on-prem; only question+chunk text is sent to the LLM

### When *not* to use Context Pool

- **Very large corpora (10,000+ pages)** — sequential scanning is thorough but not fast. For massive document sets, a vector-search approach will be faster (though less exhaustive).
- **Real-time Q&A over live databases** — Context Pool is file-based, not a connector to live data sources.
- **Multi-user production SaaS** — designed for personal or team self-hosting, not consumer-scale multi-tenancy.

---

## 2. How It Works

Context Pool processes every query in four deterministic phases:

```
Documents
    │
    ▼
┌─────────────┐
│  1. PARSE   │  Convert each file to clean Markdown (PDF text, DOCX, HTML, EML, OCR)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  2. CHUNK   │  Split Markdown into overlapping token-bounded segments
│             │  preserving heading hierarchy and page markers
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  3. SCAN    │  Call the LLM on every chunk, one at a time
│             │  Prompt: "Does this chunk answer the question? Return JSON."
│             │  Positive hits go into the answer pool
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 4. SYNTHESIZE│ Send all pooled hits to the LLM
│             │  Prompt: "Synthesize a final answer with citations."
│             │  Returns: { final_answer, citations[] }
└─────────────┘
```

### The chunk scan contract

Every chunk gets exactly this prompt shape:

```
System: You are a strict extractive answer engine.
        Answer ONLY from the provided document chunk.
        If the chunk contains relevant information, respond with valid JSON:
        {"has_answer": true, "answer": "...", "evidence_quotes": ["..."]}
        If the chunk does NOT contain relevant information, respond with exactly: {}

User:   Question: <your question>

        Chunk:
        <chunk text>
```

A chunk that returns `{}` is discarded. A chunk that returns `{"has_answer": true, ...}` is added to the pool.

### The synthesis contract

```
System: You are a synthesis engine. Given pooled evidence from document chunks,
        produce a final answer as strict JSON:
        {"final_answer": "...", "citations": [{"doc_id":"","chunk_id":"","quote":"","page_marker":"","heading_path":""}]}

User:   Question: <your question>

        Pooled evidence:
        [Chunk 1 | chunk_id:... | doc:... | heading | page]
        Answer: ...
        Evidence: [...]
        ...
```

---

## 3. Quick Start (Docker)

### Prerequisites

- Docker Desktop installed and running
- An API key for at least one supported LLM provider (or Ollama running locally)

### Step 1 — Clone and configure

```bash
git clone https://github.com/your-org/context-pool.git
cd context-pool

# Create the config directory and copy the example
mkdir -p config
cp config.example.yaml config/config.yaml
```

### Step 2 — Edit config.yaml

Open `config/config.yaml` and set your provider and model:

```yaml
provider: openai          # openai | anthropic | google | ollama
api_key: "ENV:OPENAI_API_KEY"   # or paste key directly
model: "gpt-4o-mini"
```

### Step 3 — Set environment variables

Create a `.env` file at the project root:

```bash
# Required: your LLM provider key
OPENAI_API_KEY=sk-...

# Optional: enable API authentication (recommended for non-local deployments)
# API_KEY=your-secret-key-here

# Optional: OCR support for scanned PDFs and images
# OCR_API_KEY=your-ocr-space-key
```

### Step 4 — Start

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| UI | http://localhost:3000 |
| API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |

> **First-time build:** Docker downloads base images and installs dependencies. This takes 2–5 minutes. Subsequent starts are instant.

---

## 4. Local Development Setup

For active development without Docker:

### Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Set required env vars
export CONFIG_PATH=./data/config/config.yaml
export DATA_DIR=./data/documents

# Create directories
mkdir -p data/config data/documents
cp ../config.example.yaml data/config/config.yaml
# Edit data/config/config.yaml with your key

uvicorn src.main:app --reload --port 8000
```

### Frontend (Next.js)

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
# → http://localhost:3000
```

---

## 5. Configuring a Provider

All provider settings live in `config/config.yaml`. Changes can also be made through the UI at **Settings** (requires admin key in production).

### OpenAI

```yaml
provider: openai
api_key: "ENV:OPENAI_API_KEY"   # or "sk-proj-..."
model: "gpt-4o-mini"            # or gpt-4o, gpt-4-turbo, etc.
context_window_tokens: 128000
max_chunk_tokens: 24000
```

**Recommended models:** `gpt-4o-mini` (fast & cheap), `gpt-4o` (highest quality)

### Anthropic

```yaml
provider: anthropic
api_key: "ENV:ANTHROPIC_API_KEY"
model: "claude-3-5-haiku-20241022"   # or claude-3-5-sonnet-20241022
context_window_tokens: 200000
max_chunk_tokens: 32000
```

**Recommended models:** `claude-3-5-haiku-20241022` (fast), `claude-3-5-sonnet-20241022` (best reasoning)

### Google Gemini

```yaml
provider: google
api_key: "ENV:GOOGLE_API_KEY"
model: "gemini-2.0-flash"
context_window_tokens: 1000000
max_chunk_tokens: 48000
```

**Recommended models:** `gemini-2.0-flash` (fast & large context), `gemini-1.5-pro`

### Ollama (Local Models)

```yaml
provider: ollama
api_key: ""              # Not required
model: "llama3.2"        # Any model you have pulled
context_window_tokens: 8192
max_chunk_tokens: 3000   # Keep well below model's actual limit
ollama_base_url: "http://host.docker.internal:11434"   # Docker Desktop on Windows/Mac
# ollama_base_url: "http://172.17.0.1:11434"           # Linux Docker
timeouts:
  chunk_call_seconds: 180    # Local inference is slow — increase generously
  synthesis_seconds: 300
```

> **Linux note:** `host.docker.internal` does not resolve inside containers on Linux. Use the Docker bridge IP (`172.17.0.1`) or run with `--network=host`.

### Token sizing guidelines

| Setting | Meaning | Guidance |
|---|---|---|
| `context_window_tokens` | Model's maximum total context | Set to your model's advertised limit |
| `max_chunk_tokens` | Maximum size of one document chunk | ~20% of context window; leave room for prompt overhead |

---

## 6. Step-by-Step UI Walkthrough

### 6.1 Create a Workspace

A **workspace** is a named collection of documents. All queries run against the documents within a workspace.

1. Open http://localhost:3000 — you land on the **Workspaces** page
2. Click **New workspace**
3. Enter a name (e.g. "Q3 Contracts", "Research Papers", "Support Tickets")
4. Press **Create** — you are taken to the workspace's Documents page

> Workspace names can be up to 200 characters. You can have as many workspaces as you need — they are isolated from each other.

### 6.2 Upload Documents

1. From the **Documents** page, click **Upload files** or drag files directly onto the dashed drop zone
2. Select one or more files (multiple files can be uploaded at once)
3. Wait for the upload confirmation — each file appears in the table with its name, type, size, and upload date
4. Repeat until all relevant documents are uploaded

**File size limit:** 100 MB per file
**Supported types:** PDF (text), PDF (scanned, requires OCR), DOCX, TXT, MD, HTML, EML, PNG, JPG

> Documents are stored on your Docker volume (`documents_data`). They persist across container restarts.

### 6.3 Ask a Question

1. Click **Ask** in the sidebar (or navigate to `/workspace/{id}/ask`)
2. Fill in the form:

#### Question
Type your question in natural language. Be specific — the more precise the question, the better the extraction.

```
What are the payment terms in each contract?
Which documents mention a liability cap, and what is the amount?
Summarize all data retention obligations.
```

#### Scope
- **Entire workspace** — all documents in the workspace are scanned
- **Single document** — only the selected document is scanned

Use single-document mode when you know which file contains the answer, to reduce cost and time.

#### OCR (optional)
Enable OCR if your documents include **scanned PDFs** (image-based, no embedded text) or **image files** (PNG, JPG). OCR sends each page image to the OCR.space API. Requires `OCR_API_KEY` to be set.

> Do not enable OCR for native text PDFs — it is slower and less accurate than direct text extraction.

#### Email scope (EML files only)
When the workspace contains `.eml` files:
- **Body + attachments** — scans both the email body and any attached documents
- **Body only** — scans only the email text
- **Attachments only** — ignores the email body and scans only attachments

#### System instructions (advanced)
An optional free-text field appended to the system prompt for every chunk scan and synthesis call. Use this to:
- Change response language: `Respond in French.`
- Restrict scope: `Only consider clauses marked BINDING.`
- Adjust format: `Summarize each hit in bullet points.`

> System instructions give you control over model behaviour. Keep them concise — they are sent with every chunk call, which multiplies cost.

3. Click **Run query** — you are taken to the progress page

### 6.4 Reading the Results

After synthesis completes, you land on the **Results** page.

#### Final Answer
The synthesized response appears at the top in a highlighted card. This is the model's best answer based on all positive-hit chunks.

#### Citations
Below the answer, each citation is shown as a collapsible card:

| Field | Description |
|---|---|
| **Document name** | The source file |
| **Heading path** | Section/heading hierarchy within the document |
| **Page marker** | Page number (for PDFs with embedded page markers) |
| **Evidence quote** | Verbatim text from the document chunk that supports the answer |

Click any citation card to expand and read the evidence quote.

#### Token usage
A collapsible section at the bottom shows:
- `scan_total` — tokens consumed across all chunk scans
- `synthesis` — tokens consumed for the final synthesis call
- `overall` — combined total

### 6.5 Inspecting Chunks

Click **Inspect chunks** on the Results page to see every individual chunk that returned a positive hit during scanning. This view shows:

- Which chunk number (e.g. "chunk 3 of 47")
- The heading path and page marker
- The full evidence quote as extracted by the model
- The source document filename

This is useful for verifying that the model's extractions are accurate and for debugging unexpected results.

### 6.6 Downloading a Report

Click **Download report** on the Results page to save a `.json` file containing:

```json
{
  "run_id": "...",
  "workspace_id": "...",
  "question": "...",
  "final_answer": "...",
  "citations": [
    {
      "doc_id": "...",
      "chunk_id": "...",
      "quote": "...",
      "page_marker": "p.12",
      "heading_path": "Section 3 > Payment Terms"
    }
  ],
  "token_usage": { ... }
}
```

The report is a complete audit trail of the query run — question, answer, all citations, and token counts.

---

## 7. Advanced Query Options

### Querying a single document

When your workspace has many documents but you need to interrogate a specific one, select **Single document** scope and choose the file from the dropdown. This reduces cost proportionally to how many documents you skip.

### Custom system prompts per query

The **System instructions** field is a per-query override. Examples:

```
# Language
Respond in German. Use formal Sie-form.

# Format
Extract all dates mentioned and return them as a bulleted list in ISO 8601 format.

# Scope restriction
Only consider paragraphs that are part of the "Obligations" section.

# Persona
You are a senior counsel. Flag any clause that could expose the company to liability.
```

### Combining OCR with email scope

When scanning `.eml` files that contain scanned PDF attachments:
- Set **Email scope** to `Attachments only` or `Body + attachments`
- Enable **OCR**

Context Pool will parse the email body as Markdown, then OCR each attached image/scanned PDF separately, and treat all content as a unified set of chunks.

### Adjusting chunk size for accuracy vs. cost

In **Settings**, `max_chunk_tokens` controls how large each chunk is:

| Chunk size | Trade-off |
|---|---|
| Smaller (e.g. 4 000) | More chunks, more LLM calls, higher cost — but each call has more focused context |
| Larger (e.g. 32 000) | Fewer chunks, cheaper — but the model may miss subtle answers buried in long chunks |

A good starting point is 20–25% of your model's context window.

---

## 8. Settings Reference

Access via **Settings** in the workspace sidebar, or `PATCH /api/settings` (requires `X-Admin-Key` header in production).

| Setting | Default | Description |
|---|---|---|
| `provider` | — | LLM provider: `openai`, `anthropic`, `google`, `ollama` |
| `model` | — | Provider-specific model name |
| `context_window_tokens` | 128 000 | Model's maximum context length |
| `max_chunk_tokens` | 24 000 | Maximum tokens per document chunk |
| `timeouts.chunk_call_seconds` | 60 | Seconds before a single chunk call times out |
| `timeouts.synthesis_seconds` | 120 | Seconds before the synthesis call times out |
| `temperatures.scanning` | 0.1 | Temperature for chunk scan calls (lower = more deterministic) |
| `temperatures.synthesis` | 0.2 | Temperature for synthesis call |
| `ollama_base_url` | `http://host.docker.internal:11434` | Ollama endpoint (Ollama provider only) |

> **API keys cannot be updated via the UI or API** — they must be set via environment variable (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`) and referenced in `config.yaml` as `ENV:VAR_NAME`.

---

## 9. Supported File Types

| Format | Extension(s) | Parser | OCR needed? | Notes |
|---|---|---|---|---|
| PDF (text-based) | `.pdf` | PyMuPDF | No | Preserves page markers, extracts inline text |
| PDF (scanned) | `.pdf` | OCR.space | **Yes** | Enable OCR toggle in query form |
| Word document | `.docx` | python-docx | No | Extracts paragraphs and headings as Markdown |
| Plain text / Markdown | `.txt`, `.md` | passthrough | No | Normalized and passed through directly |
| HTML | `.html`, `.htm` | BeautifulSoup | No | Tags stripped, text extracted |
| Email | `.eml` | email stdlib | No (body) / **Yes** (scanned attachments) | Body + attachments separately parsed |
| Images | `.png`, `.jpg`, `.jpeg` | OCR.space | **Yes** | Full image OCR via API |

### File limits

- **Per file:** 100 MB maximum
- **Workspace:** No enforced limit (bounded by Docker volume size)
- **Filename:** Up to 255 characters; special characters and path separators are stripped

---

## 10. Security & Production Setup

### Enabling authentication

By default (local dev), Context Pool requires no authentication. For any non-local deployment, set the `API_KEY` environment variable:

```bash
# .env file or docker-compose override
API_KEY=your-strong-random-key-here
```

Once set:
- All REST API calls must include `X-API-Key: your-strong-random-key-here`
- All WebSocket connections must include `?api_key=your-strong-random-key-here`
- The `NEXT_PUBLIC_API_KEY` frontend env var is set automatically from `API_KEY` in `docker-compose.yml`

### Admin key for settings

To allow only specific users to change provider settings:

```bash
ADMIN_API_KEY=different-admin-key
```

`PATCH /api/settings` then requires `X-Admin-Key: different-admin-key`. If `ADMIN_API_KEY` is not set, `API_KEY` is used as the admin key.

### CORS for custom domains

```bash
CORS_ORIGINS=https://your-domain.com,https://app.your-domain.com
```

### Reverse proxy (recommended)

For HTTPS, put Context Pool behind nginx or Caddy:

```nginx
server {
    listen 443 ssl;
    server_name context-pool.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
    }

    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### API key storage

API keys for LLM providers are **never stored in plain text** in source code. The recommended approach is:

```yaml
# config.yaml
api_key: "ENV:OPENAI_API_KEY"   # reads from environment
```

```bash
# .env (git-ignored)
OPENAI_API_KEY=sk-proj-...
```

The `.env` file is listed in `.gitignore` and is never committed.

---

## 11. REST API Reference

All endpoints are prefixed with `/api`. Requires `X-API-Key` header when `API_KEY` env var is set.

### Workspaces

#### `POST /api/workspaces`
Create a new workspace.

**Request body:**
```json
{ "name": "My Workspace" }
```

**Response `201`:**
```json
{
  "ws_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Workspace",
  "document_count": 0
}
```

---

#### `GET /api/workspaces`
List all workspaces.

**Response `200`:**
```json
{
  "workspaces": [
    { "ws_id": "...", "name": "...", "document_count": 3, "created_at": "..." }
  ]
}
```

---

#### `DELETE /api/workspaces/{ws_id}`
Delete a workspace and all its documents.

**Response `204` (no body)**

---

### Documents

#### `POST /api/workspaces/{ws_id}/documents`
Upload one or more documents. Use `multipart/form-data`.

```bash
curl -X POST http://localhost:8000/api/workspaces/{ws_id}/documents \
  -H "X-API-Key: your-key" \
  -F "files=@contract.pdf" \
  -F "files=@appendix.docx"
```

**Response `201`:**
```json
{
  "documents": [
    { "doc_id": "...", "filename": "contract.pdf", "size": 204800, "type": "pdf", "uploaded_at": "..." }
  ]
}
```

**Errors:**
- `413` — file exceeds 100 MB limit
- `422` — unsupported file extension
- `400` — MIME type does not match extension

---

#### `GET /api/workspaces/{ws_id}/documents`
List all documents in a workspace.

**Response `200`:**
```json
{
  "documents": [
    { "doc_id": "...", "filename": "...", "size": 0, "type": "pdf", "uploaded_at": "..." }
  ]
}
```

---

#### `DELETE /api/workspaces/{ws_id}/documents/{doc_id}`
Delete a single document.

**Response `204` (no body)**

---

### Query

#### `POST /api/query`
Start a query run. Returns immediately with a `run_id`.

**Request body:**
```json
{
  "workspace_id": "550e8400-...",
  "doc_id": null,
  "question": "What are the termination clauses?",
  "ocr_enabled": false,
  "eml_scope": "both",
  "system_prompt_extra": null
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `workspace_id` | string | required | Target workspace |
| `doc_id` | string\|null | `null` | Specific document, or `null` for entire workspace |
| `question` | string | required | The question to answer |
| `ocr_enabled` | boolean | `false` | Enable OCR for scanned PDFs and images |
| `eml_scope` | `"body"` \| `"attachments"` \| `"both"` | `"both"` | EML parsing scope |
| `system_prompt_extra` | string\|null | `null` | Appended to system prompt for all LLM calls |

**Response `202`:**
```json
{ "run_id": "7f3d9c2a-..." }
```

---

#### `GET /api/query/{run_id}/result`
Poll for query result.

**Response `202`** (still running):
```json
{ "status": "scanning" }
```

**Response `200`** (complete):
```json
{
  "final_answer": "The contract specifies a 30-day notice period for termination.",
  "citations": [
    {
      "doc_id": "...",
      "chunk_id": "...",
      "quote": "Either party may terminate this Agreement upon 30 days written notice.",
      "page_marker": "p.4",
      "heading_path": "Section 12 > Termination"
    }
  ],
  "token_usage": {
    "scan_total": { "input_tokens": 45200, "output_tokens": 1100 },
    "synthesis": { "input_tokens": 2400, "output_tokens": 380 },
    "overall": { "input_tokens": 47600, "output_tokens": 1480 }
  }
}
```

**Response `500`** (failed):
```json
{ "status": "failed", "error": "Provider timeout after 60s" }
```

---

#### `GET /api/query/{run_id}/report`
Download the full run as a JSON file.

**Response `200`:** `Content-Disposition: attachment; filename="report-{run_id}.json"`

---

### Settings

#### `GET /api/settings`
Get current configuration (API key is never returned).

**Response `200`:**
```json
{
  "provider": "openai",
  "api_key_set": true,
  "model": "gpt-4o-mini",
  "context_window_tokens": 128000,
  "max_chunk_tokens": 24000,
  "timeouts": { "chunk_call_seconds": 60, "synthesis_seconds": 120 },
  "temperatures": { "scanning": 0.1, "synthesis": 0.2 },
  "ollama_base_url": "http://host.docker.internal:11434"
}
```

---

#### `PATCH /api/settings`
Update configuration. Requires `X-Admin-Key` header in production.

**Request body** (all fields optional):
```json
{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "max_chunk_tokens": 32000
}
```

> `api_key` cannot be updated via this endpoint. Set it via environment variable.

---

## 12. WebSocket Reference

Connect to receive real-time progress events for a running query.

**Endpoint:** `WS /ws/query/{run_id}?api_key={your_key}`

> The `api_key` query parameter is required when `API_KEY` is set on the server. Browsers cannot set custom headers on WebSocket connections, so the key is passed in the URL.

### Events

#### `chunk_progress`
Emitted after each chunk is scanned.

```json
{ "type": "chunk_progress", "current": 12, "total": 47 }
```

#### `synthesis_started`
Emitted when all chunks have been scanned and synthesis begins.

```json
{ "type": "synthesis_started" }
```

#### `synthesis_finished`
Emitted when synthesis is complete. Poll `GET /api/query/{run_id}/result` to retrieve the result.

```json
{ "type": "synthesis_finished" }
```

#### `error`
Emitted if the run fails.

```json
{ "type": "error", "message": "Provider rate limit exceeded" }
```

### Example client (JavaScript)

```javascript
const socket = new WebSocket(`ws://localhost:8000/ws/query/${runId}?api_key=${apiKey}`);

socket.onmessage = (e) => {
  const event = JSON.parse(e.data);

  if (event.type === "chunk_progress") {
    const pct = Math.round((event.current / event.total) * 100);
    console.log(`Scanning: ${event.current}/${event.total} (${pct}%)`);
  }

  if (event.type === "synthesis_finished") {
    // Fetch the result
    fetch(`http://localhost:8000/api/query/${runId}/result`)
      .then(r => r.json())
      .then(result => console.log(result.final_answer));
  }

  if (event.type === "error") {
    console.error("Run failed:", event.message);
  }
};
```

---

## 13. Understanding Token Usage

Context Pool tracks tokens at two phases:

### Scan phase
Each chunk scan is an independent LLM call. For a document with 50 chunks, that's 50 calls. Token cost per call:

```
input tokens  ≈  system_prompt (~120 tokens)
             +  "Question: {question}" (~50 tokens)
             +  "Chunk:\n{chunk_text}" (up to max_chunk_tokens)

output tokens ≈  {} (no hit, ~2 tokens) OR
              ≈  {"has_answer": true, ...} (hit, ~50–200 tokens)
```

### Synthesis phase
One call containing all positive hits:

```
input tokens  ≈  system_prompt (~150 tokens)
             +  "Question: {question}" (~50 tokens)
             +  all pooled hit summaries

output tokens ≈  final JSON with answer + citations (~200–600 tokens)
```

### Estimating cost

For a 50-chunk document with `max_chunk_tokens = 24000` and GPT-4o-mini:

| Phase | Approx tokens | GPT-4o-mini cost |
|---|---|---|
| Scan (50 chunks × 24K in, 5 out avg) | ~1.2M input, ~250 output | ~$0.18 |
| Synthesis (assuming 5 hits) | ~2K input, ~400 output | ~$0.0003 |
| **Total** | | **~$0.18** |

Cost scales linearly with document size and number of documents.

---

## 14. Troubleshooting

### "Config file not found"

```
RuntimeError: Config file not found at /data/config/config.yaml.
```

**Fix:** Ensure the `./config` directory exists and contains `config.yaml`:

```bash
mkdir -p config
cp config.example.yaml config/config.yaml
# Edit config/config.yaml with your provider and API key reference
```

### "Environment variable not set"

```
RuntimeError: Config references environment variable 'OPENAI_API_KEY' but it is not set.
```

**Fix:** Add the variable to your `.env` file or `docker-compose.yml` environment section:

```bash
# .env
OPENAI_API_KEY=sk-proj-your-key-here
```

### Upload returns 400 "MIME type does not match extension"

This means you tried to upload a file whose actual content does not match its `.extension`. For example, an HTML file saved as `.txt`. Rename the file with the correct extension.

### Upload returns 413 "exceeds 100 MB limit"

Split large files or compress them before uploading. For PDFs, consider splitting into chapters.

### Run stays in "scanning" forever

1. Check backend logs: `docker logs context-pool-backend`
2. Check for provider timeout errors
3. For Ollama: increase `chunk_call_seconds` to 300+
4. For large documents: the scan is sequential — a 200-page PDF will take minutes

### WebSocket disconnects immediately

If `API_KEY` is set on the server, ensure you pass `?api_key=your-key` in the WebSocket URL.

### "Synthesis returned invalid JSON"

The model returned a response that couldn't be parsed as JSON. This sometimes happens with smaller local models. Try:
- Switching to a larger or more capable model
- Reducing `temperatures.synthesis` to `0.0`
- Checking that the synthesis timeout isn't too short (increase `synthesis_seconds`)

### Docker volume permissions

If the backend logs show permission errors on `/data/documents`:

```bash
docker-compose down -v   # removes the volume
docker-compose up --build
```

> This deletes all stored documents. Re-upload after recreating.

---

## 15. FAQ

**Q: Does Context Pool send my documents to the cloud?**
A: Your documents are stored locally on your Docker volume. Only the text of individual chunks (and your question) is sent to the LLM provider API. If you use Ollama, nothing leaves your machine at all.

**Q: Why exhaustive scanning instead of embeddings?**
A: Semantic search with embeddings can miss relevant chunks when the question uses different vocabulary than the document. Exhaustive scanning guarantees every chunk is evaluated — making it more reliable for legal, compliance, and research use cases where you cannot afford to miss a relevant passage.

**Q: Can I run multiple queries simultaneously?**
A: Yes. Each query gets its own `run_id` and runs as an independent background task. Multiple concurrent queries are supported.

**Q: What happens if I delete a document mid-query?**
A: The query will fail at the point where it tries to read the deleted file. The error is captured and surfaced in the UI.

**Q: How are page numbers tracked?**
A: PDF parsers insert page markers (`<!-- page 5 -->`) into the extracted Markdown. These markers are preserved through chunking and passed to the LLM, which includes them in citations.

**Q: Can I use Context Pool as a programmatic API only (no UI)?**
A: Absolutely. The REST API and WebSocket are full first-class interfaces. The UI is just a client. See the [REST API Reference](#11-rest-api-reference) and [WebSocket Reference](#12-websocket-reference).

**Q: Is there a way to cache results?**
A: Not built-in. Because Context Pool re-parses documents fresh for every query, results aren't cached. For repeated identical queries, download the JSON report and reference it offline.

**Q: How do I update the LLM provider without restarting Docker?**
A: Use `PATCH /api/settings` with the `X-Admin-Key` header, or edit `config/config.yaml` directly and send a `PATCH /api/settings` call to reload it.

**Q: What LLM capabilities are required?**
A: The model must be able to follow JSON output instructions reliably. Models that frequently ignore the JSON format (common with very small local models, < 7B parameters) will produce poor results. GPT-4o-mini, Claude Haiku, Gemini Flash, and Llama 3.2 8B+ all work well.
