"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const navItems = [
  { label: "Documents", href: "documents" },
  { label: "Ask",       href: "ask" },
  { label: "Settings",  href: "settings" },
];

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--surface)] flex flex-col">
      {/* Top nav */}
      <header className="border-b border-[var(--border)] px-6 py-3 flex items-center gap-6">
        <Link href="/workspaces" className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
          Context Pool
        </Link>
        <span className="text-[var(--border)]">/</span>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const href = `/workspace/${id}/${item.href}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={item.href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-[var(--surface-overlay)] text-[var(--text-primary)] font-medium"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
