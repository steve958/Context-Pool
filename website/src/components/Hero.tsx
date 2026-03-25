"use client";
export default function Hero() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        paddingTop: 64,
      }}
    >
      {/* Background glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 900,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(124,106,247,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Grid lines */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.18,
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
        }}
      />

      <div className="container-sm" style={{ position: "relative", textAlign: "center", paddingTop: 80, paddingBottom: 100 }}>
        {/* Logo mark above headline */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="Context Pool" width={64} height={64}
               style={{ display: "block", filter: "drop-shadow(0 0 20px rgba(124,106,247,0.4))" }} />
        </div>

        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(124,106,247,0.1)",
            border: "1px solid rgba(124,106,247,0.3)",
            borderRadius: 100,
            padding: "5px 14px",
            marginBottom: 32,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
          <span style={{ fontSize: 13, color: "var(--accent-2)", fontWeight: 500 }}>Open source · Self-hosted · No vector DB</span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            marginBottom: 24,
            background: "linear-gradient(135deg, var(--text) 40%, var(--accent-2) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Document Q&A without<br />embeddings or guesswork
        </h1>

        {/* Subheading */}
        <p
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
            color: "var(--text-2)",
            maxWidth: 560,
            margin: "0 auto 40px",
            lineHeight: 1.7,
          }}
        >
          Context Pool exhaustively scans every chunk of every document,
          pools positive hits, and synthesizes a final answer with
          verbatim citations — all running on your own infrastructure.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 64 }}>
          <a
            href="#quickstart"
            style={{
              background: "var(--accent)",
              color: "#fff",
              padding: "13px 28px",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "none",
              transition: "opacity 0.15s, transform 0.15s",
              display: "inline-block",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "0.88";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            Get started →
          </a>
          <a
            href="https://github.com/your-org/context-pool"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "var(--surface-2)",
              color: "var(--text)",
              padding: "13px 28px",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "none",
              border: "1px solid var(--border)",
              transition: "border-color 0.15s, transform 0.15s",
              display: "inline-block",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            View on GitHub
          </a>
        </div>

        {/* Terminal demo */}
        <TerminalDemo />

        {/* Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 48,
            flexWrap: "wrap",
            marginTop: 56,
            paddingTop: 40,
            borderTop: "1px solid var(--border)",
          }}
        >
          {[
            { n: "4", label: "LLM providers" },
            { n: "8", label: "File formats" },
            { n: "0", label: "Vector DBs needed" },
            { n: "100%", label: "Self-hosted" },
          ].map(({ n, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--accent-2)", letterSpacing: "-0.03em" }}>{n}</div>
              <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TerminalDemo() {
  const lines = [
    { type: "comment", text: "# 3 commands to get started" },
    { type: "cmd", text: "git clone https://github.com/your-org/context-pool" },
    { type: "cmd", text: "echo 'API_KEY=sk-...' > .env" },
    { type: "cmd", text: "docker-compose up --build" },
    { type: "output", text: "✓  backend   ready  http://localhost:8000" },
    { type: "output", text: "✓  frontend  ready  http://localhost:3000" },
  ];

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        textAlign: "left",
        maxWidth: 620,
        margin: "0 auto",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,106,247,0.08)",
      }}
    >
      {/* Titlebar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface-2)",
        }}
      >
        {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.8 }} />
        ))}
        <span style={{ marginLeft: 8, fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
          terminal
        </span>
      </div>
      {/* Lines */}
      <div style={{ padding: "18px 20px", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 2 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
            {l.type !== "output" && l.type !== "comment" && (
              <span style={{ color: "var(--accent)", userSelect: "none" }}>$</span>
            )}
            {l.type === "comment" && <span style={{ color: "var(--text-3)", userSelect: "none" }}>{"  "}</span>}
            {l.type === "output" && <span style={{ color: "var(--text-3)", userSelect: "none" }}>{"  "}</span>}
            <span
              style={{
                color:
                  l.type === "comment"
                    ? "var(--text-3)"
                    : l.type === "output"
                    ? "var(--green)"
                    : "var(--text)",
              }}
            >
              {l.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
