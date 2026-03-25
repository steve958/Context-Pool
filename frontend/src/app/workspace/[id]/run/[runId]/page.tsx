"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRunWebSocket, WsEvent } from "@/lib/ws";
import { Spinner } from "@/components/ui/Spinner";

type Phase = "scanning" | "synthesizing" | "done" | "error";

export default function RunProgressPage() {
  const { id: wsId, runId } = useParams<{ id: string; runId: string }>();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("scanning");
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  useRunWebSocket(runId, (event: WsEvent) => {
    if (event.type === "chunk_progress") {
      setCurrent(event.current);
      setTotal(event.total);
      setPhase("scanning");
    } else if (event.type === "synthesis_started") {
      setPhase("synthesizing");
    } else if (event.type === "synthesis_finished") {
      setPhase("done");
      router.push(`/workspace/${wsId}/run/${runId}/results`);
    } else if (event.type === "error") {
      setPhase("error");
      setErrorMsg(event.message);
    }
  });

  const progress = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-8">
      <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
        {phase === "error" ? (
          <>
            <div className="text-red-400 text-3xl">✕</div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Run failed</p>
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {errorMsg}
            </p>
            <button
              onClick={() => router.push(`/workspace/${wsId}/ask`)}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              ← Try again
            </button>
          </>
        ) : phase === "synthesizing" ? (
          <>
            <Spinner size="lg" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Synthesizing answer…</p>
            <p className="text-xs text-[var(--text-muted)]">
              Combining {total} positive hits into a final answer
            </p>
          </>
        ) : (
          <>
            <Spinner size="lg" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {total > 0 ? `Scanning chunk ${current} / ${total}` : "Preparing…"}
            </p>

            {/* Progress bar */}
            {total > 0 && (
              <div className="w-full">
                <div className="h-1.5 w-full rounded-full bg-[var(--surface-overlay)]">
                  <div
                    className="h-1.5 rounded-full bg-[var(--accent)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">{progress}%</p>
              </div>
            )}

            <p className="text-xs text-[var(--text-muted)]">
              Sequential scan — every chunk is checked exhaustively
            </p>
          </>
        )}
      </div>
    </div>
  );
}
