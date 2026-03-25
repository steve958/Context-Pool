# Context Pool

**Self-hosted document Q&A — no embeddings, no vector DB.**

Context Pool answers questions over your documents by performing a sequential, exhaustive scan across every chunk using your chosen LLM. Every chunk is checked. Positive hits are pooled and synthesized into a final JSON answer with verbatim citations.

[![Docker Pulls](https://img.shields.io/docker/pulls/steve958/context-pool-backend?label=backend%20pulls&logo=docker)](https://hub.docker.com/r/steve958/context-pool-backend)
[![Docker Pulls](https://img.shields.io/docker/pulls/steve958/context-pool-frontend?label=frontend%20pulls&logo=docker)](https://hub.docker.com/r/steve958/context-pool-frontend)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/steve958/Context-Pool?style=flat)](https://github.com/steve958/Context-Pool/stargazers)

---

## Why Context Pool?

Most RAG tools use embeddings to *guess* which chunks are relevant. Context Pool doesn't guess — it reads everything. This makes it:

- **Thorough** — nothing is skipped due to embedding distance
- **Auditable** — every citation links to a verbatim quote in your source document
- **Transparent** — you pick the model; it does exactly what you'd do manually, at scale

---

## Quick Start

```bash
# 1. Copy and configure
cp config.example.yaml config/config.yaml
# Edit config/config.yaml — set provider, api_key, model

# 2. Start
docker-compose -f docker-compose.hub.yml up

# UI  → http://localhost:3000
# API → http://localhost:8000/docs
```

No build step. Images are pulled from Docker Hub automatically.

> **Want to build locally?** Use `docker-compose up --build` instead.

---

## Features

- **Sequential exhaustive scan** — every chunk is evaluated, no prefiltering
- **Strict extractive output** — the LLM can only cite text that exists in the chunk
- **Verbatim citations** — every answer links to exact quotes with page number and heading path
- **JSON report export** — download the full answer + citations + token usage
- **WebSocket progress** — real-time chunk-by-chunk progress bar
- **4 LLM providers** — OpenAI, Anthropic, Google Gemini, Ollama
- **7 file types** — PDF (text + scanned), DOCX, TXT, Markdown, HTML, EML
- **Workspaces** — organise documents into logical collections
- **Docker Desktop** — runs on Windows, macOS, Linux with one command

---

## Supported File Types

| Type | Parser | OCR |
|---|---|---|
| PDF (text-based) | pdfplumber | No |
| PDF (scanned) | OCR.space API | Opt-in |
| DOCX | python-docx | No |
| TXT / Markdown | passthrough | No |
| HTML | beautifulsoup4 | No |
| EML (email + attachments) | email stdlib | No |
| PNG / JPG | OCR.space API | Opt-in |

---

## LLM Providers

| Provider | Models |
|---|---|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4.1, … |
| Anthropic | claude-3-5-haiku, claude-3-7-sonnet, … |
| Google | gemini-2.0-flash, gemini-1.5-pro, … |
| Ollama | any locally-running model |

---

## Configuration

Edit `config/config.yaml` (copied from `config.example.yaml`):

```yaml
provider: openai
api_key: "sk-..."          # or "ENV:OPENAI_API_KEY"
model: "gpt-4o-mini"

context_window_tokens: 128000
max_chunk_tokens: 24000

timeouts:
  chunk_call_seconds: 60
  synthesis_seconds: 120

temperatures:
  scanning: 0.1
  synthesis: 0.2
```

All settings can also be changed live from the Settings screen in the UI — no restart needed.

---

## API

Full REST + WebSocket API. See [API_GUIDE.md](API_GUIDE.md) or the live Swagger docs at `http://localhost:8000/docs`.

```bash
# Create a workspace
curl -X POST http://localhost:8000/api/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name": "My Docs"}'

# Upload a document
curl -X POST http://localhost:8000/api/workspaces/{ws_id}/documents \
  -F "files=@contract.pdf"

# Start a query run
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"workspace_id": "{ws_id}", "question": "What is the termination clause?"}'

# Download the JSON report
curl http://localhost:8000/api/query/{run_id}/report -o report.json
```

---

## Docker Hub Images

| Image | Link |
|---|---|
| `steve958/context-pool-backend` | [hub.docker.com](https://hub.docker.com/r/steve958/context-pool-backend) |
| `steve958/context-pool-frontend` | [hub.docker.com](https://hub.docker.com/r/steve958/context-pool-frontend) |

---

## Development

See [GUIDE.md](GUIDE.md) for the full local development guide.

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.
