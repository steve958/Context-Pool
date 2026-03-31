# Query History & Persistence — Implementation Plan

## Overview

This document details the implementation strategy for adding query history and persistence to Context Pool.

**Goal:** Persist query runs to disk, allow users to view historical runs, and provide UI for managing history.

**Estimated Effort:** 32 hours

---

## 1. Requirements

### Core Requirements
| Aspect | Current State | Target State |
|--------|---------------|--------------|
| **Storage** | In-memory only (`RunRegistry._runs`) | Persistent JSON files on disk |
| **Lifespan** | 24 hours (auto-cleanup) | Indefinite (user-managed) |
| **Access** | Only via `run_id` during session | Listable, searchable per workspace |
| **UI** | No history view | Dedicated history page with filters |
| **API** | Only active run endpoints | CRUD for historical runs |

### Functional Requirements
1. **FR-H1:** All query runs are persisted to disk immediately upon completion
2. **FR-H2:** Users can list all runs for a workspace with pagination
3. **FR-H3:** Users can view details of any historical run (question, answer, citations, token usage)
4. **FR-H4:** Users can delete individual runs or clear workspace history
5. **FR-H5:** Users can re-run the same question against current documents
6. **FR-H6:** Export historical run to JSON/HTML report (even if already downloaded)

### Non-Functional Requirements
1. **NFR-H1:** Backward compatible — existing API contracts unchanged
2. **NFR-H2:** Storage-efficient — JSON files compressed for large runs
3. **NFR-H3:** Performant — history loads in <200ms for workspaces with 100+ runs
4. **NFR-H4:** Safe — atomic writes prevent corruption; graceful handling of missing runs

---

## 2. Data Model

### Storage Layout
```
/data/
├── documents/          # Existing: uploaded files
├── config/             # Existing: config.yaml
└── runs/               # NEW: persisted query runs
    ├── index.json      # NEW: workspace → run_ids mapping
    └── {ws_id}/        # NEW: per-workspace run storage
        ├── {run_id}.json.gz
        └── ...
```

### Run Persistence Schema (`{run_id}.json`)
```json
{
  "metadata": {
    "run_id": "uuid",
    "workspace_id": "uuid",
    "doc_id": "uuid | null",
    "question": "string",
    "created_at": "2026-03-27T10:00:00Z",
    "completed_at": "2026-03-27T10:05:00Z",
    "status": "complete | failed",
    "document_count": 5,
    "chunk_count": 47,
    "positive_hits": 3
  },
  "config_snapshot": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "max_chunk_tokens": 24000
  },
  "result": {
    "final_answer": "string",
    "citations": [...],
    "token_usage": {...}
  },
  "pool": [
    {
      "chunk_id": "...",
      "doc_id": "...",
      "answer": "...",
      "evidence_quotes": [...],
      "heading_path": "...",
      "page_marker": "..."
    }
  ]
}
```

### Workspace Index Schema (`index.json`)
```json
{
  "version": 1,
  "last_updated": "2026-03-27T10:00:00Z",
  "workspaces": {
    "ws_uuid_1": {
      "run_ids": ["run_1", "run_2", "run_3"],
      "run_count": 3,
      "last_run_at": "2026-03-27T10:00:00Z"
    }
  }
}
```

---

## 3. Task Breakdown

### Backend Tasks

| Task ID | Task | Description | Files | Est. Hours |
|---------|------|-------------|-------|------------|
| **H-01** | Create `RunRepository` service | File-based persistence with compression, atomic writes, index management | `backend/src/services/run_repository.py` (new) | 4 |
| **H-02** | Integrate persistence into pipeline | Save completed runs to disk; handle failures gracefully | `backend/src/services/pipeline.py` | 2 |
| **H-03** | Create history API router | List, get, delete, clear, rerun endpoints | `backend/src/routers/history.py` (new) | 3 |
| **H-04** | Wire up new router | Add history router to main app; ensure dirs on startup | `backend/src/main.py` | 1 |

### Frontend Tasks

| Task ID | Task | Description | Files | Est. Hours |
|---------|------|-------------|-------|------------|
| **H-05** | Add TypeScript types | RunMetadata, RunDetail interfaces | `frontend/src/lib/types.ts` (new) | 1 |
| **H-06** | Extend API client | listRuns, getRun, deleteRun, clearRuns, rerunQuery | `frontend/src/lib/api.ts` | 2 |
| **H-07** | Build history list page | Paginated list with delete/rerun actions | `frontend/src/app/workspace/[id]/history/page.tsx` (new) | 4 |
| **H-08** | Build history detail page | View historical run results (reuse components) | `frontend/src/app/workspace/[id]/history/[runId]/page.tsx` (new) | 3 |
| **H-09** | Update workspace navigation | Add History tab to layout | `frontend/src/app/workspace/[id]/layout.tsx` | 1 |
| **H-10** | Add date formatting utility | Relative time (2 hours ago) | `frontend/src/lib/utils.ts` | 1 |

### Testing & Documentation

| Task ID | Task | Description | Files | Est. Hours |
|---------|------|-------------|-------|------------|
| **H-11** | Handle existing runs migration | Ensure in-memory runs still work; optional persist on shutdown | `backend/src/services/pipeline.py` | 2 |
| **H-12** | Testing | Unit tests for Repository; integration tests for API; E2E for UI flows | Various test files | 6 |
| **H-13** | Documentation | Update API_GUIDE.md with history endpoints; update GUIDE.md with UI walkthrough | `API_GUIDE.md`, `GUIDE.md` | 2 |

**Total: 32 hours**

---

## 4. API Endpoints

```
GET    /api/workspaces/{ws_id}/runs              # List runs (paginated)
GET    /api/workspaces/{ws_id}/runs/{run_id}     # Get run details
DELETE /api/workspaces/{ws_id}/runs/{run_id}     # Delete single run
DELETE /api/workspaces/{ws_id}/runs              # Clear all workspace runs
POST   /api/workspaces/{ws_id}/runs/{run_id}/rerun  # Re-run query
```

---

## 5. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Gzip compression** | Runs with large pools can be 100KB+; compression reduces storage ~80% |
| **Atomic writes (temp + rename)** | Prevents corruption if process crashes during write |
| **Separate workspace directories** | Easy backup/restore per workspace; natural sharding |
| **Index file** | Fast workspace-level queries without filesystem scans |
| **Metadata-only list** | Fast list view; full data loaded only for detail view |

---

## 6. Implementation Order

1. **Backend First** (H-01 to H-04) - Establish API contract
2. **Frontend** (H-05 to H-10) - Build UI consuming the API
3. **Testing & Docs** (H-11 to H-13) - Validate and document

---

*Generated: 2026-03-27*
