"use client";
import { useState } from "react";
import { SectionLabel, SectionTitle, SectionSub } from "./HowItWorks";

const tabs = [
  {
    id: "docker",
    label: "Docker (recommended)",
    steps: [
      {
        title: "Clone the repo",
        code: `git clone https://github.com/your-org/context-pool.git
cd context-pool`,
      },
      {
        title: "Create config",
        code: `mkdir -p config
cp config.example.yaml config/config.yaml
# Edit config/config.yaml — set provider + model`,
      },
      {
        title: "Set your API key",
        code: `# Create .env at the project root
echo "OPENAI_API_KEY=sk-proj-..." > .env

# Optional: enable API authentication
echo "API_KEY=your-secret-here" >> .env`,
      },
      {
        title: "Start",
        code: `docker-compose up --build

# UI  → http://localhost:3000
# API → http://localhost:8000/docs`,
      },
    ],
  },
  {
    id: "local",
    label: "Local dev",
    steps: [
      {
        title: "Backend",
        code: `cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

mkdir -p data/config data/documents
cp ../config.example.yaml data/config/config.yaml

export CONFIG_PATH=./data/config/config.yaml
export DATA_DIR=./data/documents
export OPENAI_API_KEY=sk-proj-...

uvicorn src.main:app --reload --port 8000`,
      },
      {
        title: "Frontend",
        code: `cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
# → http://localhost:3000`,
      },
    ],
  },
  {
    id: "api",
    label: "API only",
    steps: [
      {
        title: "Create a workspace",
        code: `curl -X POST http://localhost:8000/api/workspaces \\
  -H "Content-Type: application/json" \\
  -d '{"name": "My Docs"}'
# → {"ws_id": "abc123..."}`,
      },
      {
        title: "Upload a document",
        code: `curl -X POST http://localhost:8000/api/workspaces/abc123/documents \\
  -F "files=@contract.pdf"
# → {"documents": [{"doc_id": "xyz789..."}]}`,
      },
      {
        title: "Run a query",
        code: `curl -X POST http://localhost:8000/api/query \\
  -H "Content-Type: application/json" \\
  -d '{
    "workspace_id": "abc123",
    "question": "What are the payment terms?"
  }'
# → {"run_id": "run-456..."}`,
      },
      {
        title: "Get result",
        code: `curl http://localhost:8000/api/query/run-456/result
# → {"final_answer": "...", "citations": [...]}`,
      },
    ],
  },
];

export default function QuickStart() {
  const [active, setActive] = useState("docker");
  const tab = tabs.find((t) => t.id === active)!;

  return (
    <section id="quickstart" style={{ padding: "100px 0", background: "var(--surface)" }}>
      <div className="container">
        <SectionLabel>Installation</SectionLabel>
        <SectionTitle>Up and running in minutes</SectionTitle>
        <SectionSub>Docker Compose is the fastest path. Local dev and API-only modes also supported.</SectionSub>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, marginTop: 40, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: active === t.id ? "var(--accent)" : "var(--border)",
                background: active === t.id ? "rgba(124,106,247,0.12)" : "transparent",
                color: active === t.id ? "var(--accent-2)" : "var(--text-2)",
                fontWeight: active === t.id ? 600 : 400,
                fontSize: 13.5,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Steps */}
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 16 }}>
          {tab.steps.map((step, i) => (
            <div
              key={i}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 10,
                overflow: "hidden",
                background: "var(--bg)",
              }}
            >
              {/* Step header */}
              <div
                style={{
                  padding: "12px 20px",
                  background: "var(--surface-2)",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{step.title}</span>
              </div>
              {/* Code */}
              <pre
                style={{
                  margin: 0,
                  padding: "18px 20px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  lineHeight: 1.8,
                  color: "var(--text-2)",
                  overflowX: "auto",
                  whiteSpace: "pre",
                }}
              >
                <code>{step.code}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
