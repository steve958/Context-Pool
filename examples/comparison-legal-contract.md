# Case Study: Legal Contract Analysis — Vector RAG vs Context Pool

> **Scenario:** Analyzing a 47-page Master Services Agreement (MSA) to find liability limitations for data breaches.
> 
> **The Challenge:** Critical contractual clauses are often buried in unexpected sections with terminology that doesn't match the query keywords.

---

## The Document

**Type:** Master Services Agreement (MSA)  
**Pages:** 47  
**Total Chunks:** 47 (≈1 chunk per page)  
**Source:** SaaS vendor contract with enterprise client

### Document Structure

```
§1  — Definitions and Interpretation
§2  — Scope of Engagement
§3  — Services Overview
§4  — Service Level Agreements
§5  — Data Processing and Security
§6  — Intellectual Property Rights
§7  — Payment Terms
§8  — Term and Termination
§9  — Confidentiality
§10 — Warranties
§11 — Indemnification
§12 — Governing Law
§13 — Dispute Resolution
§14 — Amendments
§15 — Notices
§16 — Assignment
§17 — Entire Agreement
§18 — Limitation of Liability ← CRITICAL SECTION
§19 — Force Majeure
§20 — Severability
§21 — Mutual Indemnification ← RELATED SECTION
§22 — Third-Party Beneficiaries
```

---

## The Question

> **"Does this contract limit our liability for data breaches?"**

This is a typical due diligence question asked during contract review. The answer determines insurance requirements, risk exposure, and negotiation priorities.

---

## Vector RAG Approach

### Step 1: Embedding & Similarity Search

The query is converted to an embedding vector. Each of the 47 chunks is scored by cosine similarity:

| Rank | Section | Similarity Score | Content Preview |
|------|---------|------------------|-----------------|
| 1 | §3.1 | 0.91 | Services overview and delivery timeline |
| 2 | §7.2 | 0.88 | Payment terms and invoice schedule |
| 3 | §12.4 | 0.85 | Governing law and jurisdiction |
| 4 | §2.1 | 0.82 | Scope of engagement and deliverables |
| 5 | §9.1 | 0.79 | Confidentiality obligations |
| ... | ... | ... | ... |
| 18 | §18.3 | 0.41 | **Liability cap for data breaches** ← MISSED |

### Why §18.3 Scored Poorly

The critical liability clause uses legal terminology that diverges from the query:

- Query keywords: "limit", "liability", "data breaches"
- §18.3 actual text: *"In no event shall either party be liable for indirect, incidental, or consequential damages arising from data loss or security breaches..."*

The embedding model didn't capture that:
- "security breaches" ≈ "data breaches"
- "In no event shall...be liable" ≈ "limits liability"
- "indirect, incidental, or consequential damages" = liability limitation

### Step 2: LLM Receives Only Top-5 Chunks

```json
{
  "context_chunks": [
    "§3.1 — Services overview...",
    "§7.2 — Payment terms...",
    "§12.4 — Governing law...",
    "§2.1 — Scope of engagement...",
    "§9.1 — Confidentiality obligations..."
  ],
  "question": "Does this contract limit our liability for data breaches?"
}
```

### Vector RAG Result

> **Answer:** "Based on the retrieved sections, the contract does not appear to contain explicit liability limits for data breaches."
>
> **Verdict:** ❌ **WRONG** — The key clause was never seen by the LLM

---

## Context Pool Approach

### Step 1: Exhaustive Sequential Scan

No embedding. No similarity scoring. Every chunk is read:

```
Chunk  1/47 — checked
Chunk  2/47 — checked
Chunk  3/47 — checked
...
Chunk 18/47 — ✅ HIT FOUND
...
Chunk 47/47 — checked
```

### Step 2: Positive Hits Identified

Context Pool found **3 relevant chunks** that together answer the question:

| Chunk | Section | Evidence Type |
|-------|---------|---------------|
| 18/47 | §18.3 | Primary liability cap |
| 19/47 | §19.1 | Force majeure carve-out |
| 21/47 | §21.2 | Mutual indemnification terms |

### Step 3: Synthesis with Citations

All 3 chunks are pooled and sent to the LLM for synthesis.

### Context Pool Result

> **Answer:** "Yes. §18.3 explicitly caps liability for data breach damages. The limitation excludes indirect, incidental, and consequential damages arising from security breaches. This is further contextualized by §19.1 (force majeure carve-out) and §21.2 (mutual indemnification obligations)."
>
> **Verbatim Citation:**
> > §18.3 — "In no event shall either party be liable for indirect, incidental, or consequential damages arising from data loss or security breaches, including but not limited to loss of profits, revenue, or business interruption, except where such damages result from gross negligence or willful misconduct."
>
> **Verdict:** ✅ **CORRECT** — With exact source citation

---

## Side-by-Side Comparison

| Aspect | Vector RAG | Context Pool |
|--------|-----------|--------------|
| **Chunks examined** | 5 of 47 (10.6%) | 47 of 47 (100%) |
| **Key clause found?** | ❌ No | ✅ Yes |
| **Answer accuracy** | Wrong | Correct |
| **Citation provided?** | N/A | ✅ Verbatim quote |
| **Processing time** | ~500ms | ~8-12 seconds |
| **Token cost** | Low (~2K tokens) | Higher (~15K tokens) |
| **Confidence** | Unknown (silent failure) | Guaranteed exhaustive |

---

## The Critical Difference: Prefiltering

### Vector RAG's Silent Failure Mode

```
Query → [Embedding Model] → Similarity Scores → Top-K Filter → LLM
                                     ↓
                              Chunks scoring below threshold
                              are SILENTLY DROPPED
```

**The problem:** You don't know what the LLM never saw.

### Context Pool's Exhaustive Guarantee

```
Query → Chunk 1 → LLM → Result?
        Chunk 2 → LLM → Result?
        Chunk 3 → LLM → Result?
        ...
        Chunk N → LLM → Result?
        
        ↓
   Pool all positive hits
        ↓
   Synthesize final answer
```

**The guarantee:** Every chunk is examined. No silent omissions.

---

## When This Matters

This isn't just about one contract clause. Prefiltering failures occur in:

| Domain | Query Example | Buried Answer Format |
|--------|---------------|---------------------|
| **Legal** | "What's the termination notice period?" | Reference in §14.3(c), not §8 (Termination) |
| **Compliance** | "Is user consent required?" | GDPR mention in §9.4 (Audit), not §5 (Privacy) |
| **Finance** | "What's our exposure if the vendor fails?" | Liability cap in §23, penalty in §7.2 |
| **Medical** | "What are the contraindications?" | Warning embedded in dosage table, not warnings section |
| **Technical** | "What's the maximum load?" | Spec in appendix table, not specs section |

---

## The Tradeoff

| Factor | Vector RAG | Context Pool |
|--------|-----------|--------------|
| **Speed** | Fast (~1s) | Slower (~10s) |
| **Cost** | Low tokens | Higher tokens |
| **Recall** | Probabilistic | Guaranteed 100% |
| **Best for** | High-volume, low-stakes search | Critical analysis where misses are costly |

### The Core Philosophy

> **Context Pool is slower because it reads every chunk. In domains where missing a single passage is unacceptable — legal, compliance, finance, medical — that slowness is the point.**

You get exhaustive recall, not probabilistic retrieval.

---

## Reproducing This Test

### Prerequisites

1. Context Pool running locally: `docker-compose up`
2. A PDF of the sample contract (or use your own)

### Steps

1. Create a workspace in Context Pool
2. Upload the contract PDF
3. Ask: "Does this contract limit our liability for data breaches?"
4. Observe: All chunks are scanned, §18.3 is found
5. Verify: Click citation to see original text

### Compare with Vector RAG

1. Use any RAG framework (LangChain, LlamaIndex, etc.)
2. Configure with same embedding model (text-embedding-3-small or similar)
3. Set top_k = 5
4. Query the same document
5. Observe: §18.3 likely not in retrieved chunks

---

## Conclusion

Vector RAG optimizes for speed and cost. It achieves this by making a dangerous assumption: that semantic similarity can reliably predict relevance. In high-stakes document analysis, this assumption fails regularly.

Context Pool optimizes for **certainty**. It guarantees that if the answer exists in the document, it will be found — with a citation you can verify.

**Use Vector RAG for:** Finding related documents in a corpus, initial exploration, low-stakes research.  
**Use Context Pool for:** Contract review, compliance audits, due diligence, legal analysis — any domain where a missed clause could be expensive.
