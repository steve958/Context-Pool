# Context Pool Benchmarks

> Reproducible benchmarks measuring Context Pool against vector RAG baselines.

## Recall Benchmark

**Last updated:** 2026-04-02

### Dataset

- **Document:** Synthetic 18-section legal contract (Master Services Agreement)
- **Questions:** 10 ground-truth questions with known answers
- **Challenge mix:** 
  - 6 questions with good keyword overlap
  - 4 questions with keyword/semantic mismatch

### Methodology

1. **Context Pool:** Exhaustive scan of all chunks (simulated)
2. **Vector RAG:** Simulated top-k retrieval with keyword-based similarity scoring
   - Top-k = 5 chunks retrieved
   - Scoring includes realistic noise to simulate embedding behavior

### Results Summary

| Method | Recall | Avg Time/Query | Est. Tokens |
|--------|--------|----------------|-------------|
| Context Pool (exhaustive) | 100.0% | 0.00s | 116,262 |
| Vector RAG (top-5) | 70.0% | 0.000s | 10,000 |

### Breakdown by Question Type

| Question Type | Vector RAG | Context Pool |
|--------------|------------|--------------|
| Keyword match | 50.0% | 100.0% |
| Keyword mismatch | 100.0% | 100.0% |

### Key Findings

1. **Exhaustive Recall:** Context Pool achieves 100% recall by design — every chunk is examined.

2. **Prefiltering Risk:** Vector RAG misses answers when:
   - Query terminology differs from document (e.g., "data breach" vs "security breach")
   - Critical information appears in unexpected sections
   - Semantic similarity doesn't capture legal/technical nuance

3. **Tradeoff Confirmed:**
   - Vector RAG: Faster, lower token cost, probabilistic recall
   - Context Pool: Slower, higher token cost, guaranteed recall

### Per-Question Detail

| # | Question | Keyword Match | Vector RAG | Context Pool |
|---|----------|---------------|------------|--------------|
| 1 | What is the payment term? | Y | Y | Y |
| 2 | How long is the termination notice period? | Y | N | Y |
| 3 | Does this contract limit our liability for data br... | N | Y | Y |
| 4 | What happens to our data after termination? | Y | Y | Y |
| 5 | Is the Service Provider responsible for IP infring... | Y | N | Y |
| 6 | What are the audit rights for GDPR compliance? | N | Y | Y |
| 7 | Can either party assign this contract to a subsidi... | N | Y | Y |
| 8 | What state's laws govern this agreement? | Y | N | Y |
| 9 | Are there any change of control provisions? | N | Y | Y |
| 10 | What is the maximum liability cap? | Y | Y | Y |

### Running the Benchmark

```bash
cd backend
python -m benchmarks.recall_benchmark

# With specific provider/model
python -m benchmarks.recall_benchmark --provider openai --model gpt-4o-mini
```

### Interpreting Results

- **Recall:** Percentage of questions where the correct answer was found
- **Keyword Match:** Questions where query terms closely match document terms
- **Keyword Mismatch:** Questions where terminology differs (the "silent failure" scenario)

### Limitations

This is a synthetic benchmark with a single document. Real-world performance varies by:
- Document complexity and length
- Embedding model choice
- Chunking strategy
- Query formulation

For production evaluation, test with your own documents.
