"use client";
import { SectionLabel, SectionTitle, SectionSub } from "./HowItWorks";

const features = [
  {
    icon: "🔎",
    title: "Exhaustive scanning",
    desc: "Every chunk of every document is evaluated. No prefiltering, no semantic shortcuts, no missed passages.",
  },
  {
    icon: "📌",
    title: "Verbatim citations",
    desc: "Every claim is backed by an exact quote from the source, with document name, page number, and heading path.",
  },
  {
    icon: "🏠",
    title: "Fully self-hosted",
    desc: "Run on your own machine or server. Documents stay in your Docker volume. Your infrastructure, your data.",
  },
  {
    icon: "🔌",
    title: "4 LLM providers",
    desc: "OpenAI, Anthropic, Google Gemini, and Ollama. Switch without changing code — just update config.yaml.",
  },
  {
    icon: "📄",
    title: "8 file formats",
    desc: "PDF (text + scanned), DOCX, TXT, Markdown, HTML, EML (with attachments), PNG, and JPEG.",
  },
  {
    icon: "👁",
    title: "OCR built in",
    desc: "Scanned PDFs and images are processed via OCR.space. Toggle per query — no permanent setup needed.",
  },
  {
    icon: "📧",
    title: "Email-aware parsing",
    desc: ".eml files are parsed intelligently: body, attachments, or both — individually chunked and cited.",
  },
  {
    icon: "⚡",
    title: "Real-time progress",
    desc: "WebSocket events stream chunk-by-chunk progress to the UI as the scan runs. No polling required.",
  },
  {
    icon: "🧩",
    title: "REST + WebSocket API",
    desc: "Every feature is available programmatically. The UI is just a client. Build your own integration.",
  },
  {
    icon: "🗂",
    title: "Workspaces",
    desc: "Organise documents into named workspaces. Query a single document or the entire workspace at once.",
  },
  {
    icon: "🎛",
    title: "Configurable chunking",
    desc: "Control chunk size, overlap strategy, and token limits. Tune the accuracy vs. cost trade-off for your use case.",
  },
  {
    icon: "🔐",
    title: "Production security",
    desc: "API key auth middleware, CORS env config, non-root Docker user, file MIME validation, and input bounds checking.",
  },
];

export default function Features() {
  return (
    <section id="features" style={{ padding: "100px 0", background: "var(--surface)" }}>
      <div className="container">
        <SectionLabel>Capabilities</SectionLabel>
        <SectionTitle>Everything you need</SectionTitle>
        <SectionSub>
          Batteries included. From OCR to citations to a production-ready Docker setup.
        </SectionSub>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 1,
            marginTop: 56,
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {features.map((f, i) => (
            <div
              key={f.title}
              style={{
                padding: "28px 26px",
                background: "var(--bg)",
                borderRight: (i + 1) % 3 !== 0 ? "1px solid var(--border)" : undefined,
                borderBottom: i < features.length - 3 ? "1px solid var(--border)" : undefined,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-2)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--bg)")}
            >
              <div style={{ fontSize: 22, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 6, fontSize: 15 }}>{f.title}</div>
              <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
