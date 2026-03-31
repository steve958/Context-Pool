# Query History Testing - Quick Reference

**Feature:** Query History & Persistence  
**Version:** v1.4.0  
**Testing Documents:**
- [QUERY_HISTORY_TESTING.md](./QUERY_HISTORY_TESTING.md) - Comprehensive guide
- [test_history_quick.sh](./test_history_quick.sh) - Automated bash script

---

## 🚀 Quick Start (5 minutes)

```bash
# 1. Start Context Pool
docker-compose up --build

# 2. Run automated test
chmod +x test_history_quick.sh
./test_history_quick.sh
```

**Expected Output:**
```
✅ All tests passed!
Query History feature is working correctly.
```

---

## 🧪 Manual Testing Checklist

### Backend API Tests

| Test | Command | Expected |
|------|---------|----------|
| **List history** | `GET /api/workspaces/{ws}/runs` | JSON with runs array |
| **Get details** | `GET /api/workspaces/{ws}/runs/{id}` | Full run details |
| **Re-run** | `POST /api/workspaces/{ws}/runs/{id}/rerun` | New run_id |
| **Delete** | `DELETE /api/workspaces/{ws}/runs/{id}` | 204 status |
| **Clear all** | `DELETE /api/workspaces/{ws}/runs` | {deleted: N} |

### Frontend UI Tests

| Test | Steps | Expected |
|------|-------|----------|
| **Navigation** | Click "History" tab | Shows history page |
| **Empty state** | New workspace → History | "No query history yet" |
| **List view** | Run query → History | Shows run with metadata |
| **View details** | Click "View" | Full result page |
| **Re-run** | Click "Re-run" | New run starts |
| **Delete** | Click "Delete" → Confirm | Run removed |

---

## 📋 Test Scenarios

### Scenario 1: First-Time User
```
1. Create new workspace
2. Upload document
3. Run query
4. Go to History tab
5. See run in list
6. Click View to see details
```

### Scenario 2: Power User Re-run
```
1. Go to History
2. Find old query
3. Click Re-run
4. Wait for completion
5. Compare results (old vs new)
```

### Scenario 3: Cleanup
```
1. History has multiple runs
2. Delete individual runs
3. Clear all history
4. Verify empty state
```

### Scenario 4: Persistence
```
1. Create run
2. Note run_id
3. Restart containers
4. Verify run still in history
```

---

## 🔍 Verifying Persistence

### Check Files on Disk

```bash
# SSH into backend container
docker exec -it context-pool-backend bash

# List runs directory
ls -la /data/runs/{workspace_id}/

# View compressed file
gunzip -c /data/runs/{ws}/{run}.json.gz | jq .

# Check index
cat /data/runs/index.json | jq .
```

### Verify Compression

```bash
# File size comparison
docker exec context-pool-backend bash -c "
  cd /data/runs/{ws} && 
  for f in *.json.gz; do
    compressed=\$(stat -c%s '\$f')
    uncompressed=\$(gunzip -c '\$f' | wc -c)
    echo \"\$f: \$compressed bytes (compressed from \$uncompressed)\" 
    echo \"Ratio: \$((100 * compressed / uncompressed))%\"
  done
"
```

---

## 🐛 Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "History empty" right after query | Query still running | Wait for completion |
| 404 on run details | Wrong run_id | Check list endpoint first |
| Files not persisting | Docker volume issue | Check `/data/runs` mount |
| Permission denied | File permissions | `chmod 755 /data/runs` |
| Compression errors | Corrupted file | Delete file, re-run query |

---

## 📊 Performance Benchmarks

| Metric | Target | Test Command |
|--------|--------|--------------|
| List 50 runs | <200ms | `time curl /runs?limit=50` |
| Get run details | <100ms | `time curl /runs/{id}` |
| Compression ratio | <25% | See script above |
| Concurrent requests | No errors | Run 10 parallel requests |

---

## 🔄 Regression Testing

After any changes, verify:
- [ ] Existing query API still works
- [ ] Active runs still function
- [ ] WebSocket events still fire
- [ ] Settings API unchanged
- [ ] Document operations work

---

## 📝 Test Data

Create test documents:

```bash
# Simple text document
echo "Test content for history testing" > test.txt

# PDF (if you have one)
cp existing.pdf test.pdf

# Upload via API
curl -X POST "http://localhost:8000/api/workspaces/{ws}/documents" \
  -F "files=@test.txt"
```

---

## ✅ Sign-Off Checklist

Before marking feature as complete:

- [ ] `test_history_quick.sh` passes
- [ ] All UI tests pass manually
- [ ] API endpoints return correct data
- [ ] Persistence verified across restarts
- [ ] Mobile responsive tested
- [ ] No console errors in browser
- [ ] Documentation updated

---

## 🆘 Getting Help

If tests fail:

1. Check backend logs: `docker logs context-pool-backend`
2. Verify health: `curl http://localhost:8000/health`
3. Check file system: `docker exec context-pool-backend ls -la /data/`
4. Review [QUERY_HISTORY_TESTING.md](./QUERY_HISTORY_TESTING.md) for detailed debugging

---

*Happy Testing!* 🧪
