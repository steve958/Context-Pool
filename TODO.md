# TODO

## History Feature

- **View returns error** — `/workspace/[id]/history/[runId]` detail page errors on load; investigate root cause
- **Replace `confirm()`/`alert()` with dialog** — delete (single run) and Clear All should use the same dialog component as workspace deletion, not browser-native prompts

## Founder Teardown Strategy: Build the Proof Layer

### Phase 1: Proof (Highest Impact)

- [ ] **Create a side-by-side comparison case study**
  - Pick one canonical document + needle-in-haystack question
  - Run it through a standard vector RAG baseline and Context Pool
  - Document missed passage vs. cited hit in `/examples/comparison-<topic>.md`
  - Build a `/compare` (or `/why-context-pool`) page on the website

- [ ] **Launch a public recall benchmark**
  - Create `backend/benchmarks/recall_benchmark.py` with a reproducible dataset
  - Measure Context Pool vs. vector RAG baseline recall scores
  - Publish results in `BENCHMARKS.md` and add a "Benchmarks" section to the website

- [ ] **Add a visual product demo (no install required)**
  - Record a 60-second screen recording of upload → scan → pooled hits → cited answer
  - Embed it on the homepage, or build an interactive "sample report" component

### Phase 2: Conversion & Trust

- [ ] **Split the hero CTA**
  - Primary: "Get Started" (install path)
  - Secondary: "See how it works" (scroll to demo/comparison)

- [ ] **Add trust assets near the hero**
  - Trust card: "Self-hosted • No vector DB • Open source"
  - Simple deployment architecture diagram
  - 2–3 use-case micro-stories framed around risk avoidance

- [ ] **Address early-stage optics**
  - Publish `ROADMAP.md` and link it from the website footer
  - Surface recent releases/changelog on the website
  - Prominently link `CONTRIBUTING.md` to signal an active community

### Phase 3: Consistency

- [ ] **Audit all public copy for precision**
  - Create a canonical source of truth (`MESSAGING.md` or `website/src/copy/facts.ts`)
  - Fix mismatches in: supported formats, feature names, version numbers, architecture descriptions
  - Ensure homepage, README, API_GUIDE, GUIDE, and Docker instructions all say the same thing

- [ ] **Unify the "Why not vector RAG?" narrative**
  - Write one canonical paragraph and use it consistently across website, README, and docs

## Quick Wins (This Week)

- [ ] Add secondary hero CTA: "See how it works"
- [ ] Add trust card near hero
- [ ] Audit homepage vs. README for format/feature count mismatches
- [ ] Publish `ROADMAP.md`
