"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, Citation, QueryResult } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

function CitationCard({ citation, index, docName }: { citation: Citation; index: number; docName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--surface-overlay)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-muted)] font-mono">[{index + 1}]</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-[var(--text-primary)]">{docName}</span>
            {citation.heading_path && (
              <span className="text-xs text-[var(--text-secondary)]">{citation.heading_path}</span>
            )}
            {citation.page_marker && (
              <Badge variant="default">{citation.page_marker}</Badge>
            )}
          </div>
        </div>
        <span className="text-[var(--text-muted)] text-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-[var(--border)]">
          <blockquote className="mt-3 rounded-md bg-[var(--surface-overlay)] px-4 py-3 font-mono text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
            {citation.quote}
          </blockquote>
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const { id: wsId, runId } = useParams<{ id: string; runId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<QueryResult | null>(null);
  const [docMap, setDocMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [res, docs] = await Promise.all([
          api.query.result(runId),
          api.documents.list(wsId),
        ]);
        setResult(res);
        setDocMap(new Map(docs.documents.map((d) => [d.doc_id, d.filename])));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load result");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [runId, wsId]);

  function handleDownload() {
    window.open(api.query.reportUrl(runId), "_blank");
  }

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Results</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/workspace/${wsId}/run/${runId}/inspect`)}>
            Inspect chunks
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            Download report
          </Button>
          <Button size="sm" onClick={() => router.push(`/workspace/${wsId}/ask`)}>
            New query
          </Button>
        </div>
      </div>

      {/* Final answer */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">Answer</p>
        <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
          {result?.final_answer}
        </p>
      </div>

      {/* Citations */}
      {result && result.citations.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
            Citations ({result.citations.length})
          </p>
          {result.citations.map((c, i) => (
            <CitationCard key={`${c.chunk_id}-${i}`} citation={c} index={i} docName={docMap.get(c.doc_id) ?? c.doc_id} />
          ))}
        </div>
      )}

      {/* Token usage */}
      {result?.token_usage && (
        <details className="text-xs text-[var(--text-muted)]">
          <summary className="cursor-pointer hover:text-[var(--text-secondary)] transition-colors">
            Token usage
          </summary>
          <pre className="mt-2 rounded-md bg-[var(--surface-overlay)] px-3 py-2 font-mono text-xs overflow-auto">
            {JSON.stringify(result.token_usage, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
