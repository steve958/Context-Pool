# Contributing to Context Pool

Thanks for your interest in contributing! Context Pool is a free, open-source project and contributions of all kinds are welcome.

---

## Ways to Contribute

- **Bug reports** — open an issue with steps to reproduce
- **Feature requests** — open an issue describing the use case
- **Code** — fix a bug, add a feature, improve docs
- **Testing** — try the app and report what doesn't work

---

## Local Development Setup

### Prerequisites

- Python 3.12+
- Node 22+
- Docker Desktop (for full end-to-end testing)
- An LLM API key (OpenAI, Anthropic, Google) or a running Ollama instance

### 1. Clone and configure

```bash
git clone https://github.com/steve958/Context-Pool.git
cd Context-Pool

cp config.example.yaml config/config.yaml
# Edit config/config.yaml with your provider and API key
```

### 2. Start the backend

```bash
cd backend
pip install -r requirements.txt

export CONFIG_PATH=../config/config.yaml
export DATA_DIR=../data

uvicorn src.main:app --reload --port 8000
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 4. Or use Docker

```bash
docker-compose up --build
```

---

## Project Structure

```
backend/src/
  config.py          ← YAML config loader
  main.py            ← FastAPI app factory
  routers/           ← REST + WebSocket endpoints
  services/          ← pipeline, chunker, storage, report
  parsers/           ← one file per document type
  connectors/        ← one file per LLM provider

frontend/src/
  app/               ← Next.js App Router pages
  components/ui/     ← primitive UI components
  components/domain/ ← domain-specific components
  lib/               ← API client, WebSocket hook
```

---

## Code Conventions

- **Backend:** snake_case, type hints on all functions, Pydantic for schemas
- **Frontend:** PascalCase components, camelCase variables, no `any` types
- **Errors:** backend returns `{"error": "message"}` JSON; frontend shows inline error states
- Keep it simple — don't add abstractions unless they're clearly needed

---

## Submitting a Pull Request

1. Fork the repo and create a branch: `git checkout -b fix/my-bug`
2. Make your changes
3. Test locally (see [TESTING.md](TESTING.md))
4. Push and open a PR against `main`
5. Describe what you changed and why

---

## Reporting Bugs

Open an issue and include:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your OS, Docker version, and which LLM provider you're using

---

## Questions?

Open a [GitHub Discussion](https://github.com/steve958/Context-Pool/discussions) — that's the best place for questions, ideas, and general feedback.
