"use client";
import { useState } from "react";
import { SectionLabel, SectionTitle, SectionSub } from "./HowItWorks";

const endpoints = [
  {
    method: "POST",
    path: "/api/workspaces",
    desc: "Create a workspace",
    request: `{
  "name": "Q3 Contracts"
}`,
    response: `{
  "ws_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Q3 Contracts",
  "document_count": 0
}`,
  },
  {
    method: "POST",
    path: "/api/workspaces/{id}/documents",
    desc: "Upload documents (multipart)",
    request: `curl -X POST .../documents \\
  -F "files=@contract.pdf" \\
  -F "files=@appendix.docx"`,
    response: `{
  "documents": [{
    "doc_id": "a1b2c3...",
    "filename": "contract.pdf",
    "size": 204800,
    "type": "pdf",
    "uploaded_at": "2026-03-24T10:00:00Z"
  }]
}`,
  },
  {
    method: "POST",
    path: "/api/query",
    desc: "Start a query run",
    request: `{
  "workspace_id": "550e8400...",
  "question": "What are the termination clauses?",
  "ocr_enabled": false,
  "eml_scope": "both",
  "system_prompt_extra": null
}`,
    response: `{
  "run_id": "7f3d9c2a-1234-5678-abcd-ef0123456789"
}`,
  },
  {
    method: "GET",
    path: "/api/query/{run_id}/result",
    desc: "Poll for the final result",
    request: `# While running:
HTTP 202  {"status": "scanning"}

# On completion:
HTTP 200`,
    response: `{
  "final_answer": "Either party may terminate upon 30 days written notice.",
  "citations": [{
    "doc_id": "a1b2c3...",
    "chunk_id": "c7d8e9...",
    "quote": "Either party may terminate this Agreement upon 30 days written notice.",
    "page_marker": "p.4",
    "heading_path": "Section 12 > Termination"
  }],
  "token_usage": {
    "scan_total": {"input_tokens": 45200, "output_tokens": 1100},
    "synthesis": {"input_tokens": 2400, "output_tokens": 380}
  }
}`,
  },
];

const methodColors: Record<string, string> = {
  GET: "#22c55e",
  POST: "#7c6af7",
  PATCH: "#f59e0b",
  DELETE: "#ef4444",
};

export default function ApiShowcase() {
  const [active, setActive] = useState(0);
  const ep = endpoints[active];

  return (
    <section id="api" style={{ padding: "100px 0" }}>
      <div className="container">
        <SectionLabel>REST API</SectionLabel>
        <SectionTitle>First-class programmatic access</SectionTitle>
        <SectionSub>
          Every feature available in the UI is accessible via REST API and WebSocket. Build your own integrations.
        </SectionSub>

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, marginTop: 56, alignItems: "start" }}>
          {/* Endpoint list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {endpoints.map((e, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor: active === i ? "var(--accent)" : "transparent",
                  background: active === i ? "rgba(124,106,247,0.08)" : "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: methodColors[e.method],
                      background: methodColors[e.method] + "18",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {e.method}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: active === i ? "var(--accent-2)" : "var(--text-2)" }}>
                    {e.path.replace("{id}", "…").replace("{run_id}", "…")}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: "var(--text-3)", paddingLeft: 2 }}>{e.desc}</span>
              </button>
            ))}

            {/* WS callout */}
            <div
              style={{
                marginTop: 12,
                padding: "14px",
                background: "rgba(124,106,247,0.06)",
                border: "1px solid rgba(124,106,247,0.2)",
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-2)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>
                WS /ws/query/{"{run_id}"}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.6 }}>
                Real-time events: chunk_progress · synthesis_started · synthesis_finished · error
              </div>
            </div>
          </div>

          {/* Code panels */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <CodePanel title="Request" code={ep.request} />
            <CodePanel title="Response" code={ep.response} accent />
          </div>
        </div>
      </div>
    </section>
  );
}

function CodePanel({ title, code, accent }: { title: string; code: string; accent?: boolean }) {
  return (
    <div
      style={{
        border: "1px solid",
        borderColor: accent ? "rgba(124,106,247,0.25)" : "var(--border)",
        borderRadius: 10,
        overflow: "hidden",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          padding: "9px 16px",
          borderBottom: "1px solid var(--border)",
          fontSize: 11,
          fontWeight: 600,
          color: accent ? "var(--accent-2)" : "var(--text-3)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          background: "var(--surface-2)",
        }}
      >
        {title}
      </div>
      <pre
        style={{
          margin: 0,
          padding: "16px",
          fontFamily: "var(--font-mono)",
          fontSize: 12.5,
          lineHeight: 1.8,
          color: "var(--text-2)",
          overflowX: "auto",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
