"use client";
export default function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Parse",
      description:
        "Each file is converted to clean Markdown — PDF text layers, DOCX headings, HTML content, EML bodies and attachments, or OCR for scanned images.",
      detail: "PyMuPDF · python-docx · BeautifulSoup · OCR.space",
      color: "#7c6af7",
    },
    {
      n: "02",
      title: "Chunk",
      description:
        "Markdown is split into token-bounded segments that respect heading boundaries and page markers. Chunk size is fully configurable.",
      detail: "Heading-aware · Token-windowed · Page-marker preserved",
      color: "#a78bfa",
    },
    {
      n: "03",
      title: "Scan",
      description:
        "Every chunk is sent to the LLM with a strict extractive prompt. Positive hits are pooled; empty chunks are discarded. No skipping, no shortcuts.",
      detail: '{"has_answer": true, "evidence_quotes": ["..."]}',
      color: "#c4b5fd",
    },
    {
      n: "04",
      title: "Synthesize",
      description:
        "All pooled hits are sent to the LLM in a single synthesis call. The result is a final answer with full citations: document, page, heading, verbatim quote.",
      detail: '{"final_answer": "...", "citations": [...]}',
      color: "#ddd6fe",
    },
  ];

  return (
    <section id="how-it-works" style={{ padding: "100px 0" }}>
      <div className="container">
        <SectionLabel>Architecture</SectionLabel>
        <SectionTitle>How Context Pool works</SectionTitle>
        <SectionSub>
          Four deterministic phases. No semantic shortcuts. Every document, every chunk, every time.
        </SectionSub>

        {/* Pipeline visual */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 2,
            marginTop: 56,
            position: "relative",
          }}
        >
          {steps.map((s, i) => (
            <div key={s.n} style={{ position: "relative" }}>
              {/* Connector arrow */}
              {i < steps.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    right: -1,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 1,
                    color: "var(--border-bright)",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                  }}
                />
              )}
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: i === 0 ? "12px 0 0 12px" : i === steps.length - 1 ? "0 12px 12px 0" : 0,
                  padding: "32px 28px",
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = s.color + "60")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
              >
                {/* Glow */}
                <div
                  style={{
                    position: "absolute",
                    top: -40,
                    right: -40,
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${s.color}18 0%, transparent 70%)`,
                    pointerEvents: "none",
                  }}
                />
                <div style={{ fontSize: 11, fontWeight: 700, color: s.color, letterSpacing: "0.1em", marginBottom: 12, fontFamily: "var(--font-mono)" }}>
                  STEP {s.n}
                </div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text)", marginBottom: 12, letterSpacing: "-0.02em" }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 16 }}>{s.description}</p>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--text-3)",
                    padding: "6px 10px",
                    background: "var(--surface-2)",
                    borderRadius: 6,
                    borderLeft: `2px solid ${s.color}`,
                  }}
                >
                  {s.detail}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Guarantee callout */}
        <div
          style={{
            marginTop: 40,
            background: "rgba(124,106,247,0.06)",
            border: "1px solid rgba(124,106,247,0.2)",
            borderRadius: 12,
            padding: "24px 32px",
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 22, flexShrink: 0 }}>🔍</span>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Exhaustive by design</div>
            <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7 }}>
              Unlike vector-search RAG, Context Pool never prefilters chunks. Every segment of every document is evaluated against your question.
              If the answer exists somewhere in your documents, Context Pool will find it — even when the vocabulary in the question differs from the document.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
        fontWeight: 800,
        letterSpacing: "-0.03em",
        color: "var(--text)",
        lineHeight: 1.15,
        marginBottom: 16,
      }}
    >
      {children}
    </h2>
  );
}

export function SectionSub({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "1.05rem", color: "var(--text-2)", maxWidth: 560, lineHeight: 1.7 }}>
      {children}
    </p>
  );
}
