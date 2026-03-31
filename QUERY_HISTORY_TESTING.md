# Testing Guide: Query History & Persistence

This document provides comprehensive testing instructions for the Query History feature.

---

## Quick Start Test

Run this 5-minute test to verify basic functionality:

```bash
# 1. Start the application
docker-compose up --build

# 2. Create a workspace
curl -X POST http://localhost:8000/api/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name": "Test History"}'
# Save the ws_id from response

# 3. Upload a test document
curl -X POST "http://localhost:8000/api/workspaces/{ws_id}/documents" \
  -F "files=@test-document.pdf"

# 4. Run a query
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "{ws_id}",
    "question": "What is the main topic?"
  }'

# 5. Check history endpoint
curl "http://localhost:8000/api/workspaces/{ws_id}/runs"
# Should return the run you just created
```

---

## Backend API Testing

### Test 1: Run Persistence

**Setup:** Start with fresh data directories

```bash
# Clean start (WARNING: deletes existing data)
docker-compose down -v
rm -rf ./data/runs
```

**Test Steps:**

1. **Create and complete a query run**
```bash
# Create workspace
WS=$(curl -s -X POST http://localhost:8000/api/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name":"Persistence Test"}' | jq -r '.ws_id')

# Upload document
curl -s -X POST "http://localhost:8000/api/workspaces/$WS/documents" \
  -F "files=@any-document.pdf"

# Start query
RUN=$(curl -s -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d "{\"workspace_id\": \"$WS\", \"question\": \"Test question?\"}" | jq -r '.run_id')

# Wait for completion
sleep 30

# Verify file exists on disk
docker exec context-pool-backend ls -la /data/runs/$WS/
# Should show: {run_id}.json.gz
```

**Expected Result:**
- File exists at `/data/runs/{ws_id}/{run_id}.json.gz`
- File size > 0 bytes
- Compressed (smaller than raw JSON would be)

---

### Test 2: History List Endpoint

```bash
# List runs
curl "http://localhost:8000/api/workspaces/$WS/runs" | jq .
```

**Expected Response:**
```json
{
  "runs": [
    {
      "run_id": "...",
      "question": "Test question?",
      "created_at": "2026-03-27T...",
      "status": "complete",
      "document_count": 1,
      "positive_hits": 0
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

**Test Pagination:**
```bash
# Create multiple runs first, then:
curl "http://localhost:8000/api/workspaces/$WS/runs?limit=5&offset=0"
curl "http://localhost:8000/api/workspaces/$WS/runs?limit=5&offset=5"
```

**Edge Cases:**
- Empty workspace: Should return `{"runs": [], "total": 0}`
- Non-existent workspace: Should return 404

---

### Test 3: Run Detail Endpoint

```bash
# Get run details
curl "http://localhost:8000/api/workspaces/$WS/runs/$RUN" | jq .
```

**Expected Response Structure:**
```json
{
  "run_id": "...",
  "workspace_id": "...",
  "doc_id": null,
  "question": "Test question?",
  "created_at": "...",
  "completed_at": "...",
  "status": "complete",
  "config_snapshot": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "max_chunk_tokens": 24000,
    "context_window_tokens": 128000
  },
  "result": {
    "final_answer": "...",
    "citations": [...],
    "token_usage": {...}
  },
  "pool": [...]
}
```

**Verify:**
- All fields present
- Timestamps are ISO format
- Result matches what was returned during active query
- Pool array contains chunk hits

---

### Test 4: Re-run Functionality

```bash
# Re-run a historical query
curl -X POST "http://localhost:8000/api/workspaces/$WS/runs/$RUN/rerun" | jq .
```

**Expected Response:**
```json
{
  "run_id": "new-uuid-here",
  "message": "Query re-run started"
}
```

**Verify:**
- New run_id is different from original
- New run appears in active queries
- Same question is used
- WebSocket events fire for new run

---

### Test 5: Delete Operations

```bash
# Delete specific run
curl -X DELETE "http://localhost:8000/api/workspaces/$WS/runs/$RUN"
# Expected: 204 No Content

# Verify deletion
curl "http://localhost:8000/api/workspaces/$WS/runs/$RUN"
# Expected: 404 Not Found

# Clear all history
curl -X DELETE "http://localhost:8000/api/workspaces/$WS/runs" | jq .
# Expected: {"deleted": N}

# Verify empty
curl "http://localhost:8000/api/workspaces/$WS/runs"
# Expected: {"runs": [], "total": 0}
```

---

### Test 6: Persistence Across Restarts

```bash
# 1. Create a run (as above)
# 2. Note the run_id
# 3. Restart containers
docker-compose restart

# 4. Verify run still exists
curl "http://localhost:8000/api/workspaces/$WS/runs/$RUN"
# Should return full run details

# 5. Check file still on disk
docker exec context-pool-backend ls -la /data/runs/$WS/
```

---

### Test 7: Compression Verification

```bash
# Check compression ratio
docker exec context-pool-backend bash -c "
  cd /data/runs/$WS && 
  for f in *.json.gz; do
    echo \"File: \$f\"
    echo \"Compressed: \$(stat -c%s '\$f') bytes\"
    echo \"Uncompressed: \$(gunzip -c '\$f' | wc -c) bytes\"
  done
"

# Expected: Compressed size should be ~20% of uncompressed
```

---

### Test 8: Concurrent Operations

```bash
# Test concurrent history operations
# Terminal 1: Start long-running query
# Terminal 2: List history (should work while query running)
# Terminal 3: Try to delete running query (should handle gracefully)
```

---

## Frontend UI Testing

### Manual Test Checklist

Navigate to `http://localhost:3000` and complete these tests:

#### Test 1: Navigation
- [ ] Click "History" tab in workspace navigation
- [ ] URL should change to `/workspace/{id}/history`
- [ ] No console errors

#### Test 2: Empty State
- [ ] Create new workspace
- [ ] Navigate to History without any queries
- [ ] Should show: "No query history yet" message
- [ ] "Ask a Question" button should navigate to Ask page

#### Test 3: History List
- [ ] Run 2-3 queries
- [ ] Navigate to History
- [ ] Verify all runs appear in list
- [ ] Check timestamps are relative ("2m ago", "1h ago")
- [ ] Verify document count and hit counts are correct
- [ ] Status badges show "complete" or "failed"

#### Test 4: View Run Details
- [ ] Click "View" on a history item
- [ ] Should navigate to `/workspace/{id}/history/{runId}`
- [ ] Verify all sections load:
  - [ ] Question
  - [ ] Config snapshot (model, provider)
  - [ ] Final answer
  - [ ] Citations (if any)
  - [ ] Token usage (expandable)
  - [ ] Pool hits (expandable)

#### Test 5: Re-run from History
- [ ] Click "Re-run" on a history item
- [ ] Should navigate to active run progress page
- [ ] Verify new run starts with same question
- [ ] Check that new run appears in history after completion

#### Test 6: Delete Single Run
- [ ] Click "Delete" on a history item
- [ ] Confirm dialog should appear
- [ ] After confirmation, item should disappear from list
- [ ] Refresh page to verify permanent deletion

#### Test 7: Clear All History
- [ ] Click "Clear All" button
- [ ] Confirm dialog should appear
- [ ] After confirmation, all items should disappear
- [ ] Empty state should appear

#### Test 8: Mobile Responsive
- [ ] Test on mobile viewport (Chrome DevTools)
- [ ] History list should stack vertically
- [ ] Buttons should be touch-friendly
- [ ] Text should be readable

---

## Integration Testing

### End-to-End Test Script

```python
# test_history_e2e.py
import requests
import time
import json

BASE = "http://localhost:8000/api"

def test_history_workflow():
    # 1. Create workspace
    ws = requests.post(f"{BASE}/workspaces", 
                       json={"name": "E2E History Test"}).json()
    ws_id = ws["ws_id"]
    print(f"✓ Created workspace: {ws_id}")
    
    # 2. Verify empty history
    runs = requests.get(f"{BASE}/workspaces/{ws_id}/runs").json()
    assert runs["total"] == 0, "History should be empty"
    print("✓ Empty history confirmed")
    
    # 3. Upload document (mock or real)
    # Skip if testing without file upload capability
    
    # 4. Run query
    query = requests.post(f"{BASE}/query", json={
        "workspace_id": ws_id,
        "question": "E2E test question?"
    }).json()
    run_id = query["run_id"]
    print(f"✓ Started query: {run_id}")
    
    # 5. Wait for completion
    time.sleep(30)  # Adjust based on typical query time
    
    # 6. Verify history has one item
    runs = requests.get(f"{BASE}/workspaces/{ws_id}/runs").json()
    assert runs["total"] == 1, "Should have one run in history"
    assert runs["runs"][0]["run_id"] == run_id
    print("✓ Run persisted to history")
    
    # 7. Get run details
    details = requests.get(f"{BASE}/workspaces/{ws_id}/runs/{run_id}").json()
    assert details["question"] == "E2E test question?"
    assert details["status"] == "complete"
    assert "result" in details
    assert "config_snapshot" in details
    print("✓ Run details correct")
    
    # 8. Re-run query
    rerun = requests.post(f"{BASE}/workspaces/{ws_id}/runs/{run_id}/rerun").json()
    new_run_id = rerun["run_id"]
    assert new_run_id != run_id
    print(f"✓ Re-run started: {new_run_id}")
    
    # 9. Wait for re-run
    time.sleep(30)
    
    # 10. Verify two runs in history
    runs = requests.get(f"{BASE}/workspaces/{ws_id}/runs").json()
    assert runs["total"] == 2, "Should have two runs"
    print("✓ Both runs in history")
    
    # 11. Delete one run
    requests.delete(f"{BASE}/workspaces/{ws_id}/runs/{run_id}")
    
    # 12. Verify deletion
    runs = requests.get(f"{BASE}/workspaces/{ws_id}/runs").json()
    assert runs["total"] == 1
    print("✓ Deletion works")
    
    # 13. Clear all
    requests.delete(f"{BASE}/workspaces/{ws_id}/runs")
    
    # 14. Verify empty
    runs = requests.get(f"{BASE}/workspaces/{ws_id}/runs").json()
    assert runs["total"] == 0
    print("✓ Clear all works")
    
    print("\n✅ All E2E tests passed!")

if __name__ == "__main__":
    test_history_workflow()
```

---

## Error Handling Tests

### Test Invalid Requests

```bash
# Non-existent workspace
curl -w "%{http_code}" "http://localhost:8000/api/workspaces/fake-uuid/runs"
# Expected: 404

# Non-existent run
curl -w "%{http_code}" "http://localhost:8000/api/workspaces/$WS/runs/fake-run"
# Expected: 404

# Invalid pagination
curl "http://localhost:8000/api/workspaces/$WS/runs?limit=999"
# Expected: 422 or capped at max

# Negative offset
curl "http://localhost:8000/api/workspaces/$WS/runs?offset=-1"
# Expected: 422
```

---

## Performance Testing

### Load Test

```bash
# Create many runs to test pagination
docker exec context-pool-backend python3 << 'EOF'
import json
import gzip
import uuid
from datetime import datetime, timezone
from pathlib import Path

# Create 100 mock runs
ws_id = "perf-test-ws"
Path(f"/data/runs/{ws_id}").mkdir(parents=True, exist_ok)

for i in range(100):
    run_data = {
        "run_id": str(uuid.uuid4()),
        "workspace_id": ws_id,
        "doc_id": None,
        "question": f"Performance test question {i}?",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "status": "complete",
        "config_snapshot": {"provider": "openai", "model": "gpt-4o-mini", "max_chunk_tokens": 24000},
        "result": {"final_answer": f"Answer {i}", "citations": [], "token_usage": {}},
        "pool": []
    }
    json_bytes = json.dumps(run_data).encode()
    compressed = gzip.compress(json_bytes)
    Path(f"/data/runs/{ws_id}/{run_data['run_id']}.json.gz").write_bytes(compressed)

print("Created 100 mock runs")
EOF

# Test pagination performance
time curl "http://localhost:8000/api/workspaces/perf-test-ws/runs?limit=50"
time curl "http://localhost:8000/api/workspaces/perf-test-ws/runs?limit=50&offset=50"

# Expected: <200ms per request
```

---

## Regression Testing

Verify existing features still work:

```bash
# Active run API unchanged
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"workspace_id": "...", "question": "Test?"}'
# Should work exactly as before

# WebSocket still works
# Settings still work
curl http://localhost:8000/api/settings

# Document operations still work
curl "http://localhost:8000/api/workspaces/{ws_id}/documents"
```

---

## Debugging Failed Tests

### Check Logs

```bash
# Backend logs
docker logs context-pool-backend

# Look for:
# - "Failed to persist run" warnings
# - File permission errors
# - JSON serialization errors
```

### Verify File System

```bash
# Check runs directory exists
docker exec context-pool-backend ls -la /data/

# Check permissions
docker exec context-pool-backend ls -la /data/runs/

# Check disk space
docker exec context-pool-backend df -h /data/
```

### Manual File Inspection

```bash
# Extract and view a run file
docker exec context-pool-backend gunzip -c /data/runs/{ws_id}/{run_id}.json.gz | jq .

# Check index file
docker exec context-pool-backend cat /data/runs/index.json | jq .
```

---

## Continuous Integration

### GitHub Actions Test Job

```yaml
# .github/workflows/test-history.yml
name: Test Query History

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start services
        run: docker-compose up -d
      
      - name: Wait for health
        run: |
          until curl -f http://localhost:8000/health; do
            sleep 2
          done
      
      - name: Run history tests
        run: |
          python test_history_e2e.py
      
      - name: Cleanup
        run: docker-compose down -v
```

---

## Summary

| Test Category | Key Tests | Expected Result |
|---------------|-----------|-----------------|
| **Persistence** | File creation, compression | Files at `/data/runs/{ws}/{run}.json.gz` |
| **API** | CRUD operations | All endpoints return correct status codes |
| **UI** | Navigation, buttons, display | All interactions work smoothly |
| **Integration** | Full workflow | End-to-end feature works |
| **Regression** | Existing features | No breaking changes |
| **Performance** | 100+ runs | <200ms response time |

---

## Reporting Issues

If tests fail, include:
1. Test case that failed
2. Expected vs actual result
3. Backend logs (`docker logs context-pool-backend`)
4. Browser console errors (for UI tests)
5. File system state (`ls -la /data/runs/`)

---

*Happy Testing!* 🧪
