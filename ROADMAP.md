# Context Pool — Roadmap

Context Pool is an exhaustive, sequential document Q&A system. Every chunk of every document is scanned — no embeddings, no vector DB, no prefiltering. This roadmap reflects where the product is headed.

---

## Released

### v1.3.0 — Query History
- Persistent query history with full run metadata
- Per-workspace history view with run details
- Delete individual runs or clear all history

### v1.2.0 — Multi-Provider Support
- OpenAI, Anthropic, Google Gemini, and Ollama all supported
- Provider and model switchable via Settings UI
- API key interpolation via `ENV:VAR_NAME`

### v1.1.0 — OCR & Extended Format Support
- Scanned PDF and image OCR via Tesseract
- EML (email) parser with attachment extraction
- HTML parser

### v1.0.0 — Initial Release
- Sequential exhaustive chunk scan pipeline
- Chunk pooling + final synthesis with citations
- WebSocket progress streaming
- Workspace + document management
- JSON report download

---

## Near-term (Next 1–2 releases)

- **Recall benchmark suite** — reproducible dataset measuring Context Pool vs. vector RAG recall scores, published as `BENCHMARKS.md`
- **Side-by-side comparison examples** — canonical needle-in-haystack document sets in `/examples/`
- **Visual product demo** — interactive sample report or annotated screenshot walkthrough (no install required)
- **ROADMAP link in website footer** — surface this document publicly

---

## Medium-term

- **Batch query mode** — run multiple questions against a workspace in one job, output consolidated report
- **Chunk inspector UI improvements** — better evidence quote highlighting, collapsible chunk viewer
- **Configurable chunk overlap** — expose heading-based vs. token-window split tuning in Settings
- **Provider health check** — validate API key and model availability before run starts
- **Report versioning** — tie JSON reports to specific document sets with checksums

---

## Longer-term (Exploring)

- **Streaming synthesis** — stream the final answer token-by-token via WebSocket
- **Multi-workspace query** — ask one question across multiple workspaces in a single run
- **Scheduled runs** — re-query a workspace on a schedule when documents are updated
- **CONTRIBUTING guide** — structured guide for external contributors

---

## What Context Pool will not do

To preserve the core architectural guarantee, these are intentional non-goals:

- **No embedding-based prefiltering** — every chunk is always scanned
- **No cloud storage** — all data stays on your infrastructure
- **No proprietary model lock-in** — the system is provider-agnostic by design
- **No black-box retrieval** — every cited passage is traceable to its source chunk

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) (coming soon) or open an issue on [GitHub](https://github.com/steve958/Context-Pool).

---

*Last updated: March 2026*
