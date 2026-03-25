"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, Document } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";

export default function AskPage() {
  const { id: wsId } = useParams<{ id: string }>();
  const router = useRouter();

  const [docs, setDocs] = useState<Document[]>([]);
  const [question, setQuestion] = useState("");
  const [scope, setScope] = useState<"workspace" | "document">("workspace");
  const [docId, setDocId] = useState("");
  const [ocrEnabled, setOcrEnabled] = useState(false);
  const [emlScope, setEmlScope] = useState<"body" | "attachments" | "both">("both");
  const [systemPromptExtra, setSystemPromptExtra] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const hasEml = docs.some((d) => d.type === "eml");

  useEffect(() => {
    api.documents.list(wsId).then((r) => {
      setDocs(r.documents);
      if (r.documents.length > 0) setDocId(r.documents[0].doc_id);
    });
  }, [wsId]);

  async function handleRun() {
    if (!question.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await api.query.create({
        workspace_id: wsId,
        doc_id: scope === "document" ? docId : null,
        question: question.trim(),
        ocr_enabled: ocrEnabled,
        eml_scope: emlScope,
        system_prompt_extra: systemPromptExtra.trim() || null,
      });
      router.push(`/workspace/${wsId}/run/${res.run_id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start query");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-6">Ask a question</h2>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* Question */}
        <Textarea
          label="Question"
          placeholder="What does the contract say about termination clauses?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
        />

        {/* Scope */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[var(--text-secondary)]">Scope</span>
          <div className="flex gap-2">
            {(["workspace", "document"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  scope === s
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40"
                }`}
              >
                {s === "workspace" ? "Entire workspace" : "Single document"}
              </button>
            ))}
          </div>
        </div>

        {/* Document picker */}
        {scope === "document" && docs.length > 0 && (
          <Select
            label="Document"
            value={docId}
            onChange={(e) => setDocId(e.target.value)}
            options={docs.map((d) => ({ value: d.doc_id, label: d.filename }))}
          />
        )}

        {/* OCR toggle */}
        <Toggle
          checked={ocrEnabled}
          onChange={setOcrEnabled}
          label="Enable OCR"
          hint="Required for scanned PDFs and images. Sends pages to OCR.space."
        />

        {/* EML scope — only shown if workspace contains EML files */}
        {hasEml && (
          <Select
            label="Email scope"
            value={emlScope}
            onChange={(e) => setEmlScope(e.target.value as typeof emlScope)}
            options={[
              { value: "both", label: "Body + attachments" },
              { value: "body", label: "Body only" },
              { value: "attachments", label: "Attachments only" },
            ]}
          />
        )}

        {/* System prompt extra */}
        <Textarea
          label="System instructions (optional)"
          placeholder="e.g. Respond in French. Only consider clauses marked BINDING."
          value={systemPromptExtra}
          onChange={(e) => setSystemPromptExtra(e.target.value)}
          rows={3}
        />

        <Button
          onClick={handleRun}
          loading={submitting}
          disabled={!question.trim() || (scope === "document" && !docId)}
          size="lg"
          className="self-end"
        >
          Run query →
        </Button>
      </div>
    </div>
  );
}
