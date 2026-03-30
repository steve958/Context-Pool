"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import type { RunDetail, Citation } from "@/lib/types";

function CitationCard({
  citation,
  index,
  docName,
}: {
  citation: Citation;
  index: number;
  docName: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--surface-overlay)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-muted)] font-mono">
            [{index + 1}]
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {docName}
            </span>
            {citation.heading_path && (
              <span className="text-xs text-[var(--text-secondary)]">
                {citation.heading_path}
              </span>
            )}
            {citation.page_marker && (
              <Badge variant="default">{citation.page_marker}</Badge>
            )}
          </div>
        </div>
        <span className="text-[var(--text-muted)] text-sm">
          {open ? "▲" : "▼"}
        </span>
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

export default function HistoryDetailPage() {
  const { id: wsId, runId } = useParams<{ id: string; runId: string }>();
  const router = useRouter();
  const [run, setRun] = useState<RunDetail | null>(null);
  const [docMap, setDocMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [runData, docs] = await Promise.all([
          api.history.get(wsId, runId),
          api.documents.list(wsId),
        ]);
        setRun(runData);
        setDocMap(new Map(docs.documents.map((d) => [d.doc_id, d.filename])));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load run");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [wsId, runId]);

  async function handleRerun() {
    setActionError("");
    try {
      const { run_id: newRunId } = await api.history.rerun(wsId, runId);
      router.push(`/workspace/${wsId}/run/${newRunId}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to rerun");
    }
  }

  async function handleDelete() {
    setActionError("");
    setDeleting(true);
    try {
      await api.history.delete(wsId, runId);
      setDeleteOpen(false);
      router.push(`/workspace/${wsId}/history`);
    } catch (err) {
      setDeleting(false);
      setActionError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          Run not found
        </div>
      </div>
    );
  }

  const createdDate = new Date(run.created_at).toLocaleString();
  const config = run.config_snapshot ?? {};
  const result = run.result;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">
            Historical Run • {createdDate}
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            {run.question}
          </h1>
          <div className="flex flex-wrap gap-3 text-sm text-[var(--text-secondary)] mt-2">
            <Badge variant={run.status === "complete" ? "success" : "danger"}>
              {run.status}
            </Badge>
            <span>Model: {config.model ?? "Unknown"}</span>
            <span>Provider: {config.provider ?? "Unknown"}</span>
            <span>Chunks: {(config.max_chunk_tokens ?? 0).toLocaleString()} tokens</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={handleRerun}>
            Re-run
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {actionError}
        </div>
      )}

      {/* Result */}
      {result ? (
        <>
          <Card className="p-5">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
              Answer
            </p>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
              {result.final_answer ?? "No answer available"}
            </p>
          </Card>

          {/* Citations */}
          {result.citations && result.citations.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                Citations ({result.citations.length})
              </p>
              {result.citations.map((c, i) => (
                <CitationCard
                  key={`${c.chunk_id ?? i}-${i}`}
                  citation={c}
                  index={i}
                  docName={docMap.get(c.doc_id) ?? c.doc_id}
                />
              ))}
            </div>
          )}

          {/* Token usage */}
          {result.token_usage && (
            <details className="text-xs text-[var(--text-muted)]">
              <summary className="cursor-pointer hover:text-[var(--text-secondary)] transition-colors">
                Token usage
              </summary>
              <pre className="mt-2 rounded-md bg-[var(--surface-overlay)] px-3 py-2 font-mono text-xs overflow-auto">
                {JSON.stringify(result.token_usage, null, 2)}
              </pre>
            </details>
          )}
        </>
      ) : (
        <Card className="p-5 text-[var(--text-secondary)]">
          No result available for this run.
        </Card>
      )}

      {/* Pool hits (if user wants to inspect) */}
      {run.pool && run.pool.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            View {run.pool.length} chunk hits
          </summary>
          <div className="mt-4 space-y-3">
            {run.pool.map((hit, i) => (
              <Card key={hit.chunk_id ?? i} className="p-4">
                <div className="text-xs text-[var(--text-muted)] mb-2">
                  Hit #{i + 1} • {docMap.get(hit.doc_id) ?? hit.doc_id}
                  {hit.heading_path && ` • ${hit.heading_path}`}
                </div>
                <p className="text-sm text-[var(--text-primary)] mb-2">
                  {hit.answer}
                </p>
                {hit.evidence_quotes && hit.evidence_quotes.length > 0 && (
                  <blockquote className="text-xs text-[var(--text-secondary)] font-mono bg-[var(--surface-overlay)] px-3 py-2 rounded">
                    {hit.evidence_quotes[0]}
                  </blockquote>
                )}
              </Card>
            ))}
          </div>
        </details>
      )}

      {/* Footer actions */}
      <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
        <Button variant="ghost" onClick={() => router.push(`/workspace/${wsId}/history`)}>
          ← Back to History
        </Button>
      </div>

      {/* Delete confirmation modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete run">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to delete this run from history? This action cannot be undone.
          </p>
          {actionError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {actionError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
