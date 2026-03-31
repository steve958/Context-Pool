# 🚀 New Feature: Query History & Persistence

**Available in Context Pool v1.4.0**

---

## Overview

Every query you run is now automatically persisted to disk. Review past questions, compare results over time, and re-run queries with a single click.

## ✨ What's New

### 💾 Automatic Persistence
- All completed queries are saved automatically
- Compressed storage (typically 80% smaller)
- Atomic writes prevent data corruption
- No manual action required

### 📜 Browse History
- View all past queries per workspace
- See relative timestamps ("2 hours ago")
- Document count and hit counts at a glance
- Status indicators (complete/failed)

### 🔄 Re-run Queries
- Re-run any historical query against current documents
- Perfect for tracking how answers change over time
- One-click operation from the UI or API

### 🔍 Deep Inspection
- Full result view with final answer
- All citations with verbatim quotes
- Token usage breakdown
- Raw chunk pool for debugging

### 🗑️ Manage History
- Delete individual runs
- Clear entire workspace history
- Full control over data footprint

---

## 📸 Screenshots

### History List View
```
┌─────────────────────────────────────────────────────────────┐
│ Query History                                      [Clear All] │
├─────────────────────────────────────────────────────────────┤
│ What are the termination clauses?                           │
│ 2h ago • 3 documents • 7 hits • complete              [View] [Re-run] [Delete] │
├─────────────────────────────────────────────────────────────┤
│ List all payment terms exceeding 30 days                    │
│ 5h ago • 5 documents • 12 hits • complete             [View] [Re-run] [Delete] │
├─────────────────────────────────────────────────────────────┤
│ Find liability caps in vendor agreements                    │
│ 1d ago • 8 documents • 4 hits • complete              [View] [Re-run] [Delete] │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 API

### List Workspace Runs
```http
GET /api/workspaces/{ws_id}/runs?limit=50&offset=0
```

```json
{
  "runs": [
    {
      "run_id": "550e8400-e29b-41d4-a716-446655440000",
      "question": "What are the termination clauses?",
      "created_at": "2026-03-27T10:00:00Z",
      "status": "complete",
      "document_count": 3,
      "positive_hits": 7
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### Get Run Details
```http
GET /api/workspaces/{ws_id}/runs/{run_id}
```

### Re-run Query
```http
POST /api/workspaces/{ws_id}/runs/{run_id}/rerun
```

```json
{
  "run_id": "new-run-uuid",
  "message": "Query re-run started"
}
```

### Delete Run
```http
DELETE /api/workspaces/{ws_id}/runs/{run_id}
```

### Clear Workspace History
```http
DELETE /api/workspaces/{ws_id}/runs
```

---

## 🐍 Python Example

```python
import requests

BASE = "http://localhost:8000/api"
ws_id = "your-workspace-id"

# List historical runs
runs = requests.get(f"{BASE}/workspaces/{ws_id}/runs").json()
print(f"Total runs: {runs['total']}")

# Re-run the first query
run_id = runs["runs"][0]["run_id"]
result = requests.post(
    f"{BASE}/workspaces/{ws_id}/runs/{run_id}/rerun"
).json()

print(f"New run: {result['run_id']}")
```

---

## 🎯 Use Cases

| Use Case | How History Helps |
|----------|-------------------|
| **Contract Evolution** | Re-run compliance queries as contracts are revised |
| **Audit Trails** | Maintain complete record for regulatory compliance |
| **Research Continuity** | Pick up long projects where you left off |
| **Team Handoffs** | New members see what questions were already asked |
| **Answer Comparison** | Compare how answers change with document updates |

---

## 📝 Technical Details

### Storage Location
```
/data/runs/
├── index.json                    # Workspace index
└── {workspace_id}/
    ├── {run_id}.json.gz         # Compressed run data
    └── ...
```

### Data Retention
- Runs persist indefinitely (user-managed deletion)
- Automatic compression reduces storage by ~80%
- In-memory runs still cleaned up after 24h (active session only)

### Backward Compatibility
- Existing API unchanged
- Active runs work exactly as before
- History is additive enhancement

---

## 🚀 Getting Started

1. Update to Context Pool v1.4.0
2. Run any query as usual
3. Click the new **History** tab in your workspace
4. Your query history starts building automatically

---

## 📚 Documentation

- [Full API Guide](./API_GUIDE.md#8-query-history)
- [Implementation Plan](./QUERY_HISTORY_PLAN.md)
- [GitHub Release](https://github.com/steve958/Context-Pool/releases)

---

**Questions or feedback?** Open an issue on [GitHub](https://github.com/steve958/Context-Pool/issues).
