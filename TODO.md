# TODO

> **Legend:** 👤 = you do this manually | 🤖 = Claude implements this

---

## History Feature

- 🤖 **View returns error** — `/workspace/[id]/history/[runId]` detail page errors on load; investigate root cause
- 🤖 **Replace `confirm()`/`alert()` with dialog** — delete (single run) and Clear All should use the same dialog component as workspace deletion, not browser-native prompts

---

## Founder Teardown Strategy: Build the Proof Layer

### Phase 1: Proof (Highest Impact)

#### 1. Side-by-side comparison case study
- 🤖 Create `/examples/comparison-legal-contract.md` — document + question + vector RAG output vs Context Pool output
- 🤖 Build `/why-context-pool` page on the website with the comparison content
- Status: **WhyNotVectorRAG.tsx section done on homepage** — dedicated page still pending

#### 2. Recall benchmark
- 🤖 Create `backend/benchmarks/recall_benchmark.py` with reproducible dataset
- 🤖 Measure Context Pool vs. vector RAG baseline recall scores
- 🤖 Publish results in `BENCHMARKS.md`
- 🤖 Add "Benchmarks" section to the website

#### 3. Visual product demo

**Step A — Record the video** 👤 *You do this*

> **What you need:**
> - Context Pool running locally (`docker-compose up`)
> - A demo PDF — 5–15 pages, something real (contract, research paper, report) with a specific buried fact
> - A screen recorder: **OBS Studio** (recommended, free) or Xbox Game Bar (`Win + G`)
> - Pre-create a workspace with the document already uploaded before recording

> **Prep your browser:**
> - Chrome or Edge, maximized
> - Zoom to 110–120% so text is readable on video
> - Close unrelated tabs
> - Dark mode on (Settings → system preference)

> **The 60-second script — practice before recording:**
>
> | Timestamp | Action | What viewer sees |
> |---|---|---|
> | 0–5s | Open `localhost:3000`, workspace already open | Clean dashboard, doc uploaded |
> | 5–12s | Go to Ask, type a specific question with a buried answer | Question being typed — make it concrete |
> | 12–15s | Hit Run | Query starts |
> | 15–40s | Let chunk progress play in real time — **do not skip** | Progress bar, chunk counter, hits appearing — this is the key moment |
> | 40–50s | Synthesis finishes, results load | Final answer with verbatim citations |
> | 50–60s | Scroll to a citation, click into it | Exact quoted passage in context |
>
> **The money shot:** `Chunk 23/47 — hit` appearing in real time. Let it play slowly — the slowness proves exhaustive scanning.

> **Recording with OBS:**
> 1. Add Source → Window Capture → select browser
> 2. Settings → Video → 1920×1080
> 3. Settings → Output → Recording Format → MP4
> 4. Hit Start Recording, run the flow, Stop Recording
>
> **Xbox Game Bar (quicker):** `Win + Alt + R` to start, same again to stop. Saves to `C:\Users\[you]\Videos\Captures`

> **After recording — trim and export:**
> - Trim dead air with **Clipchamp** (built into Windows 11)
> - For website embed: export as `.mp4`, aim for under 5MB
> - For GIF: upload MP4 to **ezgif.com**, convert — loops automatically, no autoplay issues

> **What to avoid:**
> - Don't show Docker setup steps — website already covers that
> - Don't talk over it — silent or light background music
> - Don't rush the chunk progress — slow is the proof
> - Don't use a trivial document — use something that looks real

**Step B — Embed on the website** 🤖 *Claude does this once you hand over the file*

> Once you have the `.mp4` or `.gif` file, share it and Claude will:
> - Build `ProductDemo.tsx` component — looping MP4 with a play button, or inline GIF
> - Insert it into `page.tsx` between Hero and WhyNotVectorRAG
> - Ensure mobile-safe sizing and fallback

---

### Phase 2: Conversion & Trust

- 🤖 **Split the hero CTA** — Status: **done** (primary = Get started, secondary = See how it's different)
- 🤖 **Add trust assets near the hero** — Status: **done** (trust strip: self-hosted / no vector DB / MIT)
- 🤖 **Add deployment architecture diagram** — simple SVG or image showing doc → backend → LLM → cited answer flow
- 👤 **Write 2–3 use-case micro-stories** — short paragraphs framed around risk avoidance (e.g. "missed a clause in a contract"); Claude can draft, you validate
- 🤖 **Publish `ROADMAP.md`** — Status: **done**, linked from footer
- 🤖 **Surface changelog on the website** — link NewInVersion section from footer or add a dedicated releases anchor

---

### Phase 3: Consistency

- 👤 **Audit all public copy for precision** — check that homepage, README, API_GUIDE, GUIDE, and docker instructions all agree on: supported formats count, feature names, version numbers, architecture description
- 🤖 **Fix any mismatches found** — once you list the discrepancies, Claude fixes them
- 🤖 **Create canonical messaging source** — `MESSAGING.md` or `website/src/copy/facts.ts` as single source of truth
- 🤖 **Unify the "Why not vector RAG?" narrative** — one canonical paragraph used across website, README, and docs

---

## Quick Wins (This Week)

- 🤖 Add secondary hero CTA: "See how it works" — Status: **done**
- 🤖 Add trust card near hero — Status: **done**
- 👤 Audit homepage vs. README for format/feature count mismatches
- 🤖 Publish `ROADMAP.md` — Status: **done**
- 👤 Record product demo video (see instructions above)
