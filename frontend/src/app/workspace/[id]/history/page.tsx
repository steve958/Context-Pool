"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import type { RunMetadata } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

export default function HistoryPage() {
  const { id: workspaceId } = useParams();
  const router = useRouter();
  const [runs, setRuns] = useState<RunMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadRuns();
  }, [workspaceId]);

  async function loadRuns() {
    try {
      setLoading(true);
      const data = await api.history.list(workspaceId as string);
      setRuns(data.runs);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(runId: string) {
    if (!confirm("Delete this run from history?")) return;
    try {
      await api.history.delete(workspaceId as string, runId);
      setRuns(runs.filter((r) => r.run_id !== runId));
      setTotal(total - 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleRerun(runId: string) {
    try {
      const { run_id: newRunId } = await api.history.rerun(workspaceId as string, runId);
      router.push(`/workspace/${workspaceId}/run/${newRunId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to rerun");
    }
  }

  async function handleClearAll() {
    if (!confirm("Clear ALL history for this workspace? This cannot be undone.")) return;
    try {
      await api.history.clear(workspaceId as string);
      setRuns([]);
      setTotal(0);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to clear history");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Query History</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {total} {total === 1 ? "run" : "runs"} saved
          </p>
        </div>
        {runs.length > 0 && (
          <Button variant="danger" onClick={handleClearAll}>
            Clear All
          </Button>
        )}
      </div>

      {runs.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-[var(--text-secondary)]">
            No query history yet.
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Ask a question in the Ask tab to get started.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push(`/workspace/${workspaceId}/ask`)}
          >
            Ask a Question
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <HistoryCard
              key={run.run_id}
              run={run}
              onView={() =>
                router.push(`/workspace/${workspaceId}/history/${run.run_id}`)
              }
              onRerun={() => handleRerun(run.run_id)}
              onDelete={() => handleDelete(run.run_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryCard({
  run,
  onView,
  onRerun,
  onDelete,
}: {
  run: RunMetadata;
  onView: () => void;
  onRerun: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="p-4 hover:border-[var(--accent)]/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[var(--text-primary)] truncate">
            {run.question}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)] mt-2">
            <span>{formatRelativeTime(run.created_at)}</span>
            <span>•</span>
            <span>{run.document_count} document{run.document_count !== 1 ? "s" : ""}</span>
            <span>•</span>
            <span>{run.positive_hits} hit{run.positive_hits !== 1 ? "s" : ""}</span>
            <span>•</span>
            <span
              className={
                run.status === "complete"
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {run.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={onView}>
            View
          </Button>
          <Button variant="ghost" size="sm" onClick={onRerun}>
            Re-run
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
