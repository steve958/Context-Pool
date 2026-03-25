"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

// Markdown preview is read-only rendered content passed via sessionStorage from the run
export default function MarkdownPreviewPage() {
  const { id: wsId, runId } = useParams<{ id: string; runId: string }>();
  const router = useRouter();

  // Content is stored in sessionStorage as "preview:{runId}"
  const content = typeof window !== "undefined"
    ? sessionStorage.getItem(`preview:${runId}`) ?? ""
    : "";

  // Render page markers and OCR labels distinctly
  const rendered = content
    .replace(/^(--- page \d+ ---)/gm, '<div class="page-marker">$1</div>')
    .replace(/(<!-- OCR:.*?-->)/g, '<span class="ocr-label">$1</span>');

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Parsed content preview</h2>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>← Back</Button>
      </div>

      {!content ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-12">
          No preview available. Preview is generated during a run.
        </p>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-6">
          <style>{`
            .page-marker { color: var(--accent); font-family: monospace; font-size: 11px; margin: 16px 0 8px; opacity: 0.7; }
            .ocr-label { color: #f59e0b; font-family: monospace; font-size: 11px; }
            .prose-content { font-size: 13px; color: var(--text-secondary); line-height: 1.7; white-space: pre-wrap; }
          `}</style>
          <div
            className="prose-content"
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        </div>
      )}
    </div>
  );
}
