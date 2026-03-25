"use client";
import { SectionLabel, SectionTitle, SectionSub } from "./HowItWorks";

const cases = [
  {
    icon: "⚖️",
    category: "Legal",
    title: "Contract review",
    question: "What does each contract say about termination clauses and notice periods?",
    result: "Found 7 relevant clauses across 12 contracts. Page and heading citations included.",
  },
  {
    icon: "🔬",
    category: "Research",
    title: "Literature review",
    question: "Which papers discuss transformer attention mechanisms in the context of long documents?",
    result: "Extracted relevant passages from 34 PDFs, cited by author, section, and page.",
  },
  {
    icon: "📊",
    category: "Finance",
    title: "Due diligence",
    question: "Are there any contingent liabilities or pending litigation mentioned in the disclosure documents?",
    result: "3 disclosures flagged. Verbatim evidence quotes with page references.",
  },
  {
    icon: "📧",
    category: "Discovery",
    title: "Email archive search",
    question: "Find all emails that discuss the merger timeline and list the mentioned dates.",
    result: "Scanned 240 .eml files including attachments. 18 positive hits extracted.",
  },
  {
    icon: "🏥",
    category: "Healthcare",
    title: "Clinical document review",
    question: "What contraindications are mentioned for Drug X across all patient records?",
    result: "Scanned scanned PDFs via OCR. 9 contraindications found across 15 records.",
  },
  {
    icon: "🛠",
    category: "Engineering",
    title: "Technical spec analysis",
    question: "What are the stated load-bearing limits in each structural report?",
    result: "Extracted 22 numeric values with units, pages, and table headings cited.",
  },
];

export default function UseCases() {
  return (
    <section id="usecases" style={{ padding: "100px 0", background: "var(--surface)" }}>
      <div className="container">
        <SectionLabel>Use cases</SectionLabel>
        <SectionTitle>Built for high-stakes document work</SectionTitle>
        <SectionSub>
          Wherever missing a relevant passage is not an option, exhaustive scanning pays off.
        </SectionSub>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
            marginTop: 56,
          }}
        >
          {cases.map((c) => (
            <div
              key={c.title}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "24px",
                transition: "border-color 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-bright)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--accent-2)",
                    background: "rgba(124,106,247,0.1)",
                    border: "1px solid rgba(124,106,247,0.2)",
                    borderRadius: 100,
                    padding: "2px 10px",
                  }}
                >
                  {c.category}
                </span>
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 12, letterSpacing: "-0.02em" }}>
                {c.title}
              </h3>

              {/* Question */}
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 10,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.08em", marginBottom: 5 }}>QUESTION</div>
                <div style={{ fontSize: 13, color: "var(--text-2)", fontStyle: "italic", lineHeight: 1.5 }}>"{c.question}"</div>
              </div>

              {/* Result */}
              <div
                style={{
                  background: "rgba(52, 211, 153, 0.05)",
                  border: "1px solid rgba(52,211,153,0.2)",
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", letterSpacing: "0.08em", marginBottom: 5 }}>RESULT</div>
                <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{c.result}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
