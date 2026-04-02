# Context Pool — Canonical Messaging

> **Single source of truth for product messaging.**
> 
> This document contains the approved descriptions, key facts, and narratives to use
> across the README, website, documentation, and marketing materials.

---

## Elevator Pitch (25 words)

**Primary:**
> Self-hosted document Q&A without embeddings. Every chunk is checked, every answer is cited. For when missing a clause is expensive.

**Alternative (longer):**
> Context Pool is self-hosted document Q&A that reads every chunk of every document — no vector DB, no semantic prefiltering, no silent omissions. Legal teams use it because missing one indemnification clause can cost millions.

---

## One-Liner Descriptions

| Context | Copy |
|---------|------|
| **GitHub repo tagline** | Self-hosted document Q&A without embeddings |
| **Website H1 subtitle** | Document Q&A without embeddings. Every chunk is checked. |
| **SEO meta description** | Self-hosted, open-source document Q&A. Ask questions across any document set — every chunk is checked, every answer is cited. |
| **DockerHub / package** | Self-hosted document Q&A without embeddings or vector databases |
| **Twitter/X bio** | Document Q&A that reads every chunk. No embeddings. No silent omissions. |

---

## Key Properties (The "Why Us")

Use these bullets consistently across README, website, and docs:

| Property | Description |
|----------|-------------|
| **Exhaustive** | Every chunk of every document is scanned — nothing is skipped via semantic search shortcuts |
| **Extractive** | Answers are grounded in verbatim evidence quotes from the source material |
| **Cited** | Every claim links back to a specific chunk, document, page, and heading |
| **Self-hosted** | Runs entirely on your machine via Docker. Documents never leave your infrastructure |
| **Provider-agnostic** | Works with OpenAI, Anthropic, Google Gemini, and Ollama (local models) |
| **No vector DB** | No setup beyond a YAML config — no Pinecone, Weaviate, or Chroma required |

---

## The Vector RAG Comparison (Canonical Narrative)

**When explaining why Context Pool exists, use this narrative:**

> Vector RAG prefilters chunks by similarity score before your LLM ever sees them. If the relevant passage scores low, it's silently dropped. Context Pool never prefilters — it reads every chunk.
>
> This is slower than vector RAG, but in domains where missing a single passage is unacceptable — legal, compliance, finance, medical — that slowness is the point. You get exhaustive recall, not probabilistic retrieval.

**Key phrases to reuse:**
- "prefilters by similarity score"
- "silently dropped"
- "exhaustive recall, not probabilistic retrieval"
- "slowness is the point"

---

## Supported File Formats (The Canonical List)

Always use this exact list and count:

> **7 file formats:** PDF, DOCX, HTML, EML (email), TXT, Markdown, and images (PNG/JPG with OCR)

**Technical details (for API docs):**
- PDF: Text layer extraction (PyMuPDF)
- DOCX: Structured text with heading hierarchy
- HTML: Clean body extraction
- EML: Body + attachments, with thread scope options
- Images: OCR via OCR.space (optional)
- TXT/Markdown: Native

---

## Use Cases (The "When to Use Us")

**Primary use cases:**
1. **Contract review** — find every clause mentioning a specific topic across dozens of agreements
2. **Due diligence** — scan financial disclosures, technical specs, or compliance documents
3. **Research** — extract evidence from PDFs, papers, or reports with full citations
4. **Email discovery** — search `.eml` archives including attachments
5. **OCR documents** — query scanned PDFs and images with built-in OCR support
6. **Sensitive data** — keep documents on-prem; only question+chunk text is sent to the LLM

**When NOT to use:**
- Very large corpora (10,000+ pages) — sequential scanning is thorough but not fast
- Real-time Q&A over live databases — Context Pool is file-based
- Consumer-scale multi-tenant SaaS — designed for personal or team self-hosting

---

## Architecture Summary (For Diagrams)

**The 4 phases (always in this order):**

1. **PARSE** — Convert each file to clean Markdown (PDF text, DOCX, HTML, EML, OCR)
2. **CHUNK** — Split Markdown into overlapping token-bounded segments preserving heading hierarchy
3. **SCAN** — Call the LLM on every chunk. Prompt: "Does this chunk answer the question? Return JSON."
4. **SYNTHESIZE** — Send all pooled hits to the LLM. Prompt: "Synthesize a final answer with citations."

**The flow diagram description:**
Documents → Parse → Chunk → Scan (LLM per chunk) → Pool Hits → Synthesize (LLM) → Cited Answer

---

## Technical Specifications (Canonical Numbers)

| Spec | Value | Notes |
|------|-------|-------|
| Default chunk size | 24,000 tokens | Configurable |
| Context window | 128,000 tokens | Provider-dependent |
| Supported LLM providers | 4 | OpenAI, Anthropic, Google, Ollama |
| Supported file formats | 7 | PDF, DOCX, HTML, EML, TXT, MD, images |
| License | MIT | Permissive open source |

---

## Benchmark Claims (Verified)

**Recall benchmark results (synthetic legal contract, 10 questions):**
- Context Pool: 100% recall (exhaustive by design)
- Vector RAG (top-5): 70% recall (30% silent misses)

**Performance characteristics:**
- Speed: ~8-12 seconds for 50-page document (varies by provider)
- Token usage: Higher than RAG (scans all chunks), but deterministic

---

## Voice and Tone Guidelines

**Voice characteristics:**
- **Precise**: Use specific technical terms correctly (embeddings vs vectors, prefiltering vs retrieval)
- **Honest**: Acknowledge tradeoffs explicitly (slower than RAG, higher token cost)
- **Confident**: State architectural guarantees clearly ("100% recall by design")
- **Practical**: Focus on real use cases, not hypotheticals

**Tone by context:**
- **README/Docs**: Technical, direct, example-driven
- **Website**: Benefit-focused, trust-building, visual
- **Blog/Announcements**: Conversational, story-driven

**Words to use:**
- exhaustive, deterministic, verbatim, cited, self-hosted, embedding-free
- prefilters, semantic search, similarity threshold
- chunk, scan, pool, synthesize

**Words to avoid:**
- "AI-powered" (too generic)
- "revolutionary" (hype)
- "magic" (undermines determinism)
- "all your documents" (overpromise)

---

## Component-Specific Copy

### Hero Section
```
H1: Document Q&A without embeddings
Sub: Self-hosted. Exhaustive. Cited. Ask questions across any document set — 
     every chunk is checked, every answer is traced back to its source.
CTA Primary: Get Started
CTA Secondary: See how it's different
```

### Trust Strip
```
Self-hosted / No vector DB required / MIT Licensed
```

### Why Not Vector RAG Section
```
H2: Why not vector RAG?
Sub: Vector RAG prefilters chunks by similarity score before your LLM ever 
     sees them. If the relevant passage scores low, it's silently dropped. 
     Context Pool never prefilters — it reads every chunk.
```

### Quick Start
```
H2: Get started in 5 minutes
Sub: One Docker command. One YAML file. No vector database setup.
```

---

## Version and Release Messaging

**Current version:** 1.3.0

**Latest feature highlight:**
> Query History & Persistence — Every query you run is now automatically saved to disk. Review past questions, compare results over time, and re-run with a single click.

**Release cadence note:**
> Context Pool releases follow semantic versioning. Minor versions (1.x) add features; patch versions (1.x.x) fix bugs. See GitHub Releases for changelogs.

---

## Compliance and Security Messaging

**Data handling:**
> Documents are parsed and stored locally. Only the question text and individual chunk content are sent to your configured LLM provider. No document data is logged or retained by Context Pool.

**For security reviews:**
- No outbound connections except to configured LLM provider
- No telemetry or analytics
- No persistent cloud storage
- MIT licensed — audit the source

---

## FAQ Short Answers

| Question | Short Answer |
|----------|--------------|
| "Is this like ChatGPT for my documents?" | Similar interface, but deterministic. We check every chunk, not just the "most similar" ones. |
| "Why is it slower than other RAG tools?" | Because we don't skip chunks. That slowness is the guarantee. |
| "Do I need a vector database?" | No. Context Pool doesn't use embeddings or vector search. |
| "Can I use local models?" | Yes, via Ollama. Works entirely offline. |
| "What if I have 10,000 documents?" | Context Pool is designed for deep analysis of specific document sets, not corpus-scale search. |

---

## Change Log for This Document

| Date | Change |
|------|--------|
| 2026-04-02 | Initial version — consolidated from README, website, and GUIDE |

---

## How to Update This Document

1. Propose changes via PR with rationale
2. Update all downstream locations (README, website, GUIDE) after merging
3. Document the change in the Change Log above
