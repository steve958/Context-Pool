# TODO

> **Legend:** 👤 = you do this manually | 🤖 = Kimi implements this

---

## ✅ Recently Completed (2026-04-02)

### Phase 1: Proof

- ✅ **Side-by-side comparison case study**
  - ✅ `/examples/comparison-legal-contract.md` — detailed case study document
  - ✅ `/why-context-pool` page — dedicated website page with full comparison
  
- ✅ **Recall benchmark**
  - ✅ `backend/benchmarks/recall_benchmark.py` — reproducible benchmark script
  - ✅ `BENCHMARKS.md` — published results (100% vs 70% recall)
  - ✅ Website "Benchmarks" section with results table

- ✅ **Visual product demo (Step B)**
  - ✅ `ProductDemo.tsx` component ready (awaiting video file from founder)

### Phase 2: Conversion & Trust

- ✅ **Deployment architecture diagram** — added to HowItWorks section
- ✅ **Surface changelog** — added "Releases" link to footer

### Phase 3: Consistency

- ✅ **Create canonical messaging source** — `MESSAGING.md` created
- ✅ **Unify "Why not vector RAG?" narrative** — consistent across website and examples

---

## 🔄 Remaining Tasks

### Phase 1: Proof (Awaiting Founder)

#### Visual product demo — Step A: Record the video 👤

> **Status:** 🤖 Step B ready (component built) — awaiting video file

**What you need:**
- Context Pool running locally (`docker-compose up`)
- A demo PDF — 5–15 pages, something real (contract, research paper, report) with a specific buried fact
- A screen recorder: **OBS Studio** (recommended, free) or Xbox Game Bar (`Win + G`)
- Pre-create a workspace with the document already uploaded before recording

**Prep your browser:**
- Chrome or Edge, maximized
- Zoom to 110–120% so text is readable on video
- Close unrelated tabs
- Dark mode on (Settings → system preference)

**The 60-second script — practice before recording:**

| Timestamp | Action | What viewer sees |
|---|---|---|
| 0–5s | Open `localhost:3000`, workspace already open | Clean dashboard, doc uploaded |
| 5–12s | Go to Ask, type a specific question with a buried answer | Question being typed — make it concrete |
| 12–15s | Hit Run | Query starts |
| 15–40s | Let chunk progress play in real time — **do not skip** | Progress bar, chunk counter, hits appearing — this is the key moment |
| 40–50s | Synthesis finishes, results load | Final answer with verbatim citations |
| 50–60s | Scroll to a citation, click into it | Exact quoted passage in context |

**The money shot:** `Chunk 23/47 — hit` appearing in real time. Let it play slowly — the slowness proves exhaustive scanning.

**Recording with OBS:**
1. Add Source → Window Capture → select browser
2. Settings → Video → 1920×1080
3. Settings → Output → Recording Format → MP4
4. Hit Start Recording, run the flow, Stop Recording

**Xbox Game Bar (quicker):** `Win + Alt + R` to start, same again to stop. Saves to `C:\Users\[you]\Videos\Captures`

**After recording — trim and export:**
- Trim dead air with **Clipchamp** (built into Windows 11)
- For website embed: export as `.mp4`, aim for under 5MB
- For GIF: upload MP4 to **ezgif.com**, convert — loops automatically, no autoplay issues

**What to avoid:**
- Don't show Docker setup steps — website already covers that
- Don't talk over it — silent or light background music
- Don't rush the chunk progress — slow is the proof
- Don't use a trivial document — use something that looks real

Once you have the `.mp4` or `.gif` file, share it and I'll embed it in the website.

---

### Phase 2: Conversion & Trust (Awaiting Founder)

- 👤 **Write 2–3 use-case micro-stories** — short paragraphs framed around risk avoidance (e.g., "missed a clause in a contract")
  - Can draft these for you, or you can write and I'll edit
  - Target: homepage or `/why-context-pool` page

---

### Phase 3: Consistency (Awaiting Founder Audit)

- 👤 **Audit all public copy for precision** — check that homepage, README, API_GUIDE, GUIDE, and docker instructions all agree on:
  - Supported formats count (should be 7)
  - Feature names
  - Version numbers
  - Architecture description
- 🤖 **Fix any mismatches found** — once you list the discrepancies, I'll fix them

**Quick checks you can do:**
1. Does README say "7 file formats"? Does the website? Do they list the same 7?
2. Does GUIDE mention the same version as the footer/ROADMAP?
3. Is the "4-phase pipeline" described consistently?

---

## 📋 Quick Reference: What Was Built

| File | What it is |
|------|------------|
| `/examples/comparison-legal-contract.md` | Detailed case study comparing Vector RAG vs Context Pool |
| `/why-context-pool` (page) | Dedicated website page explaining the prefiltering problem |
| `/backend/benchmarks/recall_benchmark.py` | Reproducible recall benchmark |
| `/BENCHMARKS.md` | Published benchmark results |
| `/MESSAGING.md` | Canonical messaging source of truth |
| `website/src/components/Benchmarks.tsx` | Homepage benchmarks section |
| `website/src/components/ArchitectureDiagram.tsx` | Visual deployment flow diagram |

---

## 🎯 Next Priority (Once Video is Ready)

1. Hand over the `.mp4` or `.gif` file
2. I'll embed it in `ProductDemo.tsx` and insert it into the homepage (between Hero and WhyNotVectorRAG)
3. Run final tests to ensure mobile-safe sizing
