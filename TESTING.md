# Context Pool — Manual Testing Guide

> **New:** See [QUERY_HISTORY_TESTING.md](./QUERY_HISTORY_TESTING.md) for comprehensive testing of the Query History feature.

## Prerequisites

You need **one** of:
- **Docker Desktop** (easiest, recommended) — [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
- **Python 3.12 + Node 22** installed locally (faster iteration, no build step)

You also need an **LLM API key** from one of: OpenAI, Anthropic, Google AI Studio, or a running Ollama instance.

---

## Option A — Docker (recommended for full end-to-end test)

### Step 1 — Configure your API key

Open [config/config.yaml](config/config.yaml) in the project root (already created). Edit the three lines that matter:

```yaml
provider: openai                  # openai | anthropic | google | ollama
api_key: "sk-YOUR_KEY_HERE"       # your actual key
model: "gpt-4o-mini"              # any model supported by that provider
```

**Provider-specific examples:**
```yaml
# Anthropic
provider: anthropic
api_key: "sk-ant-..."
model: "claude-3-5-haiku-20241022"

# Google Gemini
provider: google
api_key: "AIza..."
model: "gemini-2.0-flash"

# Ollama (local, no key needed)
provider: ollama
api_key: ""
model: "llama3.2"
```

Save the file. The backend reads it at startup and the Settings UI can update it live.

### Step 2 — Set the OCR key (optional)

If you want to test scanned PDF / image OCR, set this in your terminal before starting:

```powershell
# Windows PowerShell
$env:OCR_API_KEY = "K85100342388957"
```

```cmd
# Windows CMD
set OCR_API_KEY=K85100342388957
```

You can skip this if you only plan to test with text-based PDFs, DOCX, TXT, or HTML files.

### Step 3 — Build and start

```bash
cd "c:\Users\StefanMiljevic\Documents\Context Pool"
docker-compose up --build
```

First build takes ~3–5 minutes (downloads Python/Node images and installs all packages). Subsequent starts are instant.

**You should see:**
```
context-pool-backend   | INFO:     Application startup complete.
context-pool-frontend  | ▲ Next.js 15.x.x (Turbopack)
context-pool-frontend  | - Local: http://localhost:3000
```

### Step 4 — Verify health

```bash
curl http://localhost:8000/health
# Expected: {"status":"ok"}
```

Open the **Swagger UI** at [http://localhost:8000/docs](http://localhost:8000/docs) to see all API endpoints.

---

## Option B — Local development (no Docker, faster iteration)

### Backend

```powershell
cd "c:\Users\StefanMiljevic\Documents\Context Pool\backend"
pip install -r requirements.txt

$env:CONFIG_PATH = "c:\Users\StefanMiljevic\Documents\Context Pool\config\config.yaml"
$env:DATA_DIR    = "c:\Users\StefanMiljevic\Documents\Context Pool\data"
$env:OCR_API_KEY = "K85100342388957"   # optional

uvicorn src.main:app --reload --port 8000
```

### Frontend

```bash
cd "c:\Users\StefanMiljevic\Documents\Context Pool\frontend"
npm install
npm run dev
# Starts at http://localhost:3000
```

---

## Manual UI Test Walkthrough

### 1. Open the app

Navigate to [http://localhost:3000](http://localhost:3000). You will be redirected to `/workspaces`.

**Expected:** "No workspaces yet" empty state with a "New Workspace" button.

---

### 2. Create a workspace

Click **New Workspace**, type a name (e.g. `Test Project`), click **Create**.

**Expected:** A workspace card appears. Click it — you land on `/workspace/{id}/documents`.

---

### 3. Upload documents

Drag files onto the upload zone or click to select. Good test files:
- A `.pdf` (text-based) — any PDF you have
- A `.docx` or `.txt`
- A `.html` file (save any webpage as HTML)

**Expected:** Files appear in the table below with filename, size, and file type badge. Each has a delete (trash) icon.

Try uploading a duplicate — it should work (different doc_id per upload). Try deleting one with the trash icon.

---

### 4. Configure the LLM provider (Settings)

Click **Settings** in the top nav of the workspace.

Verify your provider/model loaded from `config.yaml`. If you need to change the API key or switch providers, do it here and click **Save settings**. The backend reloads config live — no restart needed.

**Expected:** "Settings saved" confirmation in green appears next to the button.

---

### 5. Ask a question

Click **Ask** in the top nav.

Type a question that you know the answer to from your uploaded documents. For example, if you uploaded a contract PDF: *"What is the termination clause?"*

**Scope:** Leave "All documents" selected for the first test. You can scope to a single document using the dropdown.

**OCR toggle:** Leave off unless you uploaded scanned images.

Click **Start scanning**.

**Expected:** You are immediately redirected to `/workspace/{id}/run/{runId}` — the progress screen.

---

### 6. Watch the progress screen

You will see:
- A spinner + "Preparing…" while the backend parses and chunks documents
- Then: `Scanning chunk 1 / N` with a progress bar filling up
- Then: `Synthesizing answer…` spinner (final LLM call combining all positive hits)
- Then: auto-redirect to `/results`

If scanning stalls at "Preparing…" for more than 10 seconds, check the backend logs for a parse or config error.

---

### 7. Review results

The results screen shows:
- **Final answer** — the synthesized response from the LLM
- **Citations** — expandable cards showing exact quotes from the source documents, with document name, heading path, and page marker

Expand a citation card by clicking it. You'll see the original quote highlighted and the source document location.

Click **Download report** to get the full JSON report with all metadata.

Click **Inspect hits** to see every chunk that returned a positive answer before synthesis.

---

### 8. Inspect raw hits

The Inspect screen shows each positive-hit chunk with:
- Document name and heading path
- The raw LLM answer for that chunk
- The evidence quote with an accent left-border highlight

Click **Preview source** on any chunk to open the full parsed markdown of that document.

---

### 9. Preview document

The Preview screen shows the full normalized markdown of the source document as the backend parsed it. Page markers (`--- page N ---`) appear as gray dividers. OCR-extracted content appears with a distinct label.

---

## API-Level Testing (curl)

Test the API directly at [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI) or with curl:

```bash
# Create a workspace
curl -X POST http://localhost:8000/api/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'

# List workspaces
curl http://localhost:8000/api/workspaces

# Upload a document (replace {ws_id} with one from above)
curl -X POST http://localhost:8000/api/workspaces/{ws_id}/documents \
  -F "files=@path/to/your/file.pdf"

# Start a query run
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"workspace_id": "{ws_id}", "question": "What is the main topic?"}'
# Returns: {"run_id": "..."}

# Poll for result (call after run completes)
curl http://localhost:8000/api/query/{run_id}/result

# Download JSON report
curl http://localhost:8000/api/query/{run_id}/report -o report.json

# Get current settings
curl http://localhost:8000/api/settings

# WebSocket — open in browser console:
# const ws = new WebSocket("ws://localhost:8000/ws/query/{run_id}");
# ws.onmessage = e => console.log(JSON.parse(e.data));
```

---

## Common Issues and Fixes

| Symptom | Cause | Fix |
|---|---|---|
| Backend exits immediately | `config.yaml` missing or invalid | Check [config/config.yaml](config/config.yaml) — ensure `provider`, `api_key`, and `model` are set |
| "Config references environment variable … but it is not set" | `api_key: "ENV:VAR"` syntax used but var not exported | Either paste the key directly or export the env var before starting |
| Frontend shows "Failed to fetch" | Backend not running or CORS mismatch | Verify `curl http://localhost:8000/health` returns `{"status":"ok"}` |
| Stuck at "Preparing…" forever | Document parse error | Check backend terminal logs — likely an unsupported file or corrupted upload |
| "Save failed" on Settings | Backend can't write to config path | Check that `./config/` directory exists and is writable |
| OCR returns empty text | `OCR_API_KEY` not set | Set the env var and restart the backend container |
| Very slow scanning | Too many large chunks | Lower `max_chunk_tokens` in Settings (try `8000`), or use a faster model |

---

## What to Validate

| Feature | Pass criteria |
|---|---|
| Workspace CRUD | Create, see in list, navigate in |
| Document upload | File appears in table with correct type badge |
| Document delete | File removed from table, no longer included in queries |
| Text PDF scan | Question answered with citations pointing to correct pages |
| DOCX scan | Question answered with citations |
| Settings save | Provider/model/key update persists after page reload |
| Progress bar | Increments smoothly chunk by chunk |
| Synthesis | Final answer is a coherent synthesis, not a repeat of one chunk |
| Citations | Expandable, quote matches source text |
| JSON report | Downloads valid JSON with `final_answer` + `citations` array |
| Inspect screen | Shows only positive-hit chunks, not all chunks |
| Preview screen | Full document markdown renders, page markers visible |
| Scoped query | Selecting a single document limits scanning to that doc |

| Markdown Preview | Full document markdown renders, page markers visible |
| Scoped query | Selecting a single document limits scanning to that doc |

---

## Testing Query History (New in v1.4.0)

### Quick API Test

```bash
# 1. Run a query first (follow steps above), then:

# 2. List history for workspace
curl http://localhost:8000/api/workspaces/{ws_id}/runs

# 3. Get specific run details
curl http://localhost:8000/api/workspaces/{ws_id}/runs/{run_id}

# 4. Re-run historical query
curl -X POST http://localhost:8000/api/workspaces/{ws_id}/runs/{run_id}/rerun

# 5. Delete a run
curl -X DELETE http://localhost:8000/api/workspaces/{ws_id}/runs/{run_id}
```

### UI Test Checklist

Open `http://localhost:3000` and test:

- [ ] **History Tab**: Click "History" in workspace navigation
- [ ] **Empty State**: New workspace shows "No query history yet" message
- [ ] **List View**: Completed queries appear with timestamps, doc counts, hit counts
- [ ] **View Details**: Click "View" to see full run details (answer, citations, token usage)
- [ ] **Re-run**: Click "Re-run" to execute same question against current documents
- [ ] **Delete Single**: Click "Delete" to remove one run with confirmation
- [ ] **Clear All**: Click "Clear All" to remove all workspace history

### What to Validate

| Feature | Pass criteria |
|---------|---------------|
| History persistence | Run appears in history after completion |
| History list | Shows question, timestamp, doc count, hits, status |
| Run details | Full result with answer, citations, token usage, pool |
| Re-run | Creates new run with same question, navigates to progress |
| Delete | Removes run from list and disk |
| Clear all | Removes all runs, shows empty state |
| Persistence | History survives container restart |

See [QUERY_HISTORY_TESTING.md](./QUERY_HISTORY_TESTING.md) for comprehensive test suite including:
- Backend API tests
- Frontend UI tests  
- Integration/E2E tests
- Performance tests
- Error handling tests
