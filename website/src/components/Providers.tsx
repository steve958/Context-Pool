"use client";
import { SectionLabel, SectionTitle, SectionSub } from "./HowItWorks";

const providers = [
  {
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    badge: "Recommended",
    badgeColor: "#22c55e",
    config: `provider: openai
api_key: "ENV:OPENAI_API_KEY"
model: "gpt-4o-mini"
context_window_tokens: 128000
max_chunk_tokens: 24000`,
    note: "gpt-4o-mini is the best cost/quality starting point.",
  },
  {
    name: "Anthropic",
    models: ["claude-3-5-sonnet", "claude-3-5-haiku", "claude-3-opus"],
    badge: "Best reasoning",
    badgeColor: "#f59e0b",
    config: `provider: anthropic
api_key: "ENV:ANTHROPIC_API_KEY"
model: "claude-3-5-haiku-20241022"
context_window_tokens: 200000
max_chunk_tokens: 32000`,
    note: "200K context window means fewer, larger chunks.",
  },
  {
    name: "Google Gemini",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    badge: "Largest context",
    badgeColor: "#3b82f6",
    config: `provider: google
api_key: "ENV:GOOGLE_API_KEY"
model: "gemini-2.0-flash"
context_window_tokens: 1000000
max_chunk_tokens: 48000`,
    note: "1M context window. Very large chunk sizes possible.",
  },
  {
    name: "Ollama",
    models: ["llama3.2", "mistral", "phi3", "deepseek-r1"],
    badge: "100% offline",
    badgeColor: "#a78bfa",
    config: `provider: ollama
api_key: ""
model: "llama3.2"
context_window_tokens: 8192
max_chunk_tokens: 3000
ollama_base_url: "http://host.docker.internal:11434"`,
    note: "Nothing leaves your machine. Requires Ollama running locally.",
  },
];

export default function Providers() {
  return (
    <section id="providers" style={{ padding: "100px 0" }}>
      <div className="container">
        <SectionLabel>LLM Providers</SectionLabel>
        <SectionTitle>Your model, your choice</SectionTitle>
        <SectionSub>
          Switch providers by changing one line in config.yaml. No code changes needed.
        </SectionSub>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginTop: 56,
          }}
        >
          {providers.map((p) => (
            <div
              key={p.name}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                overflow: "hidden",
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
              {/* Header */}
              <div style={{ padding: "20px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>{p.name}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 9px",
                    borderRadius: 100,
                    background: p.badgeColor + "18",
                    color: p.badgeColor,
                    border: `1px solid ${p.badgeColor}30`,
                  }}
                >
                  {p.badge}
                </span>
              </div>

              {/* Models */}
              <div style={{ padding: "0 20px 16px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                {p.models.map((m) => (
                  <span
                    key={m}
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                      padding: "3px 8px",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      color: "var(--text-2)",
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>

              {/* Config snippet */}
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  background: "var(--bg)",
                  padding: "14px 16px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11.5,
                  color: "var(--text-2)",
                  lineHeight: 1.9,
                  whiteSpace: "pre",
                  overflowX: "auto",
                }}
              >
                {p.config}
              </div>

              {/* Note */}
              <div style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-3)", borderTop: "1px solid var(--border)" }}>
                💡 {p.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
