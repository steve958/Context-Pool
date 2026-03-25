"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, QueryResult } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

export default function InspectPage() {
  const { id: wsId, runId } = useParams<{ id: string; runId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<QueryResult | null>(null);
  const [docMap, setDocMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.query.result(runId), api.documents.list(wsId)])
      .then(([res, docs]) => {
        setResult(res);
        setDocMap(new Map(docs.documents.map((d) => [d.doc_id, d.filename])));
      })
      .finally(() => setLoading(false));
  }, [runId, wsId]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const citations = result?.citations ?? [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Positive-hit chunks
          <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">({citations.length})</span>
        </h2>
        <Button variant="ghost" size="sm" onClick={() => router.push(`/workspace/${wsId}/run/${runId}/results`)}>
          ← Back to results
        </Button>
      </div>

      {citations.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-12">No positive hits found</p>
      ) : (
        <div className="flex flex-col gap-4">
          {citations.map((c, i) => (
            <div key={`${c.chunk_id}-${i}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 flex flex-col gap-3">
              {/* Chunk metadata */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-[var(--text-muted)]">chunk {i + 1}</span>
                {c.heading_path && (
                  <span className="text-xs text-[var(--text-secondary)]">/ {c.heading_path}</span>
                )}
                {c.page_marker && <Badge variant="info">{c.page_marker}</Badge>}
              </div>

              {/* Evidence quote — highlighted */}
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)] mb-1.5">Evidence</p>
                <blockquote className="rounded-md border-l-2 border-[var(--accent)] bg-[var(--accent)]/5 px-3 py-2 font-mono text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {c.quote}
                </blockquote>
              </div>

              <p className="text-xs text-[var(--text-muted)]">{docMap.get(c.doc_id) ?? c.doc_id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
