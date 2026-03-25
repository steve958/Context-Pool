"use client";
export default function Footer() {
  const links = [
    { label: "How it works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Providers", href: "#providers" },
    { label: "Quick start", href: "#quickstart" },
    { label: "API", href: "#api" },
    { label: "Use cases", href: "#usecases" },
    { label: "FAQ", href: "#faq" },
    { label: "GitHub", href: "https://github.com/your-org/context-pool" },
  ];

  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "48px 0 40px",
      }}
    >
      <div className="container">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          {/* Logo + tagline */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 6 }}>
              Context Pool
            </div>
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>
              Self-hosted document Q&A without embeddings · Open source
            </div>
          </div>

          {/* Links */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", justifyContent: "center" }}>
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                style={{
                  fontSize: 13,
                  color: "var(--text-3)",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-2)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-3)")}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* License */}
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>
            Released under the MIT License · {new Date().getFullYear()} Context Pool contributors
          </div>
        </div>
      </div>
    </footer>
  );
}
