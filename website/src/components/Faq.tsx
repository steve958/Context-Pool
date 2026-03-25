"use client";
import { useState } from "react";
import { SectionLabel, SectionTitle } from "./HowItWorks";

const items = [
  {
    q: "Does Context Pool send my documents to the cloud?",
    a: "No. Documents are stored on your local Docker volume. Only the text of individual chunks (plus your question) is sent to the LLM provider. With Ollama, nothing leaves your machine at all.",
  },
  {
    q: "Why not just use embeddings and vector search?",
    a: "Semantic search can miss relevant chunks when vocabulary differs between question and document — a known limitation in legal, compliance, and research contexts. Exhaustive scanning evaluates every chunk, making it more reliable when you cannot afford to miss a relevant passage.",
  },
  {
    q: "How long does a query take?",
    a: "It depends on document size and provider speed. A 50-page PDF with GPT-4o-mini typically completes in 30–90 seconds. Ollama on consumer hardware may take several minutes for the same document. Progress is streamed in real-time via WebSocket.",
  },
  {
    q: "Can I run multiple queries at once?",
    a: "Yes. Each query gets an independent run_id and executes as a background task. Concurrent queries are fully supported.",
  },
  {
    q: "What models work best?",
    a: "Models must follow JSON output instructions reliably. GPT-4o-mini, Claude 3.5 Haiku, Gemini 2.0 Flash, and Llama 3.2 8B+ all work well. Very small local models (< 7B parameters) may produce inconsistent JSON and poor extractions.",
  },
  {
    q: "How much does it cost to run a query?",
    a: "With GPT-4o-mini, scanning a 50-chunk document costs roughly $0.15–0.25 in API tokens. Cost scales linearly with document length. Synthesis adds a small fixed cost (~$0.001). Local models via Ollama cost nothing beyond electricity.",
  },
  {
    q: "Is there a UI or is it API-only?",
    a: "Both. Context Pool ships with a full Next.js UI for non-technical users. The REST API and WebSocket are first-class and fully documented — the UI is just one client.",
  },
  {
    q: "Can I use it with scanned PDFs?",
    a: "Yes. Enable OCR in the query form and set your OCR_API_KEY (OCR.space). Pages are sent for OCR, text is extracted, and the result goes through the same scan pipeline. Image files (PNG, JPG) are also supported.",
  },
  {
    q: "Is Context Pool production-ready?",
    a: "It is designed for self-hosted team or personal use. It includes API key auth, CORS configuration, non-root Docker containers, file validation, and input bounds checking. For large-scale multi-tenant SaaS deployment, additional hardening is recommended.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" style={{ padding: "100px 0" }}>
      <div className="container-sm">
        <SectionLabel>FAQ</SectionLabel>
        <SectionTitle>Common questions</SectionTitle>

        <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                border: "1px solid",
                borderColor: open === i ? "var(--border-bright)" : "var(--border)",
                borderRadius: 10,
                overflow: "hidden",
                transition: "border-color 0.15s",
              }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: "100%",
                  padding: "18px 20px",
                  background: open === i ? "var(--surface-2)" : "var(--surface)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", lineHeight: 1.4 }}>{item.q}</span>
                <span
                  style={{
                    flexShrink: 0,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: open === i ? "var(--accent)" : "var(--surface-3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: open === i ? "#fff" : "var(--text-3)",
                    fontSize: 14,
                    transition: "all 0.15s",
                  }}
                >
                  {open === i ? "−" : "+"}
                </span>
              </button>
              {open === i && (
                <div
                  style={{
                    padding: "4px 20px 18px",
                    background: "var(--surface)",
                    fontSize: 14.5,
                    color: "var(--text-2)",
                    lineHeight: 1.75,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <div style={{ paddingTop: 14 }}>{item.a}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
