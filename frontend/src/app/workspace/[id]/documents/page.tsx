"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api, Document } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

const TYPE_LABELS: Record<string, string> = {
  pdf: "PDF", docx: "DOCX", txt: "TXT", md: "MD",
  html: "HTML", htm: "HTML", eml: "EML", png: "PNG", jpg: "JPG", jpeg: "JPG",
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function DocumentsPage() {
  const { id: wsId } = useParams<{ id: string }>();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const res = await api.documents.list(wsId);
      setDocs(res.documents);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [wsId]);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      await api.documents.upload(wsId, files);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: string) {
    try {
      await api.documents.delete(wsId, docId);
      setDocs((prev) => prev.filter((d) => d.doc_id !== docId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    uploadFiles(e.dataTransfer.files);
  }, [wsId]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Documents</h2>
        <Button size="sm" onClick={() => fileRef.current?.click()} loading={uploading}>
          Upload files
        </Button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,.html,.htm,.eml,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => uploadFiles(e.target.files)}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`mb-6 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 cursor-pointer transition-colors ${
          dragging
            ? "border-[var(--accent)] bg-[var(--accent)]/5"
            : "border-[var(--border)] hover:border-[var(--accent)]/40"
        }`}
      >
        {uploading ? (
          <Spinner />
        ) : (
          <>
            <p className="text-sm text-[var(--text-secondary)]">Drop files here or click to browse</p>
            <p className="text-xs text-[var(--text-muted)]">PDF · DOCX · TXT · MD · HTML · EML · PNG · JPG</p>
          </>
        )}
      </div>

      {/* Document list */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : docs.length === 0 ? (
        <p className="text-center text-sm text-[var(--text-muted)] py-12">No documents uploaded yet</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="pb-2 font-medium text-[var(--text-muted)] text-xs">Name</th>
              <th className="pb-2 font-medium text-[var(--text-muted)] text-xs">Type</th>
              <th className="pb-2 font-medium text-[var(--text-muted)] text-xs">Size</th>
              <th className="pb-2 font-medium text-[var(--text-muted)] text-xs">Uploaded</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {docs.map((doc) => (
              <tr key={doc.doc_id} className="group">
                <td className="py-2.5 pr-4 text-[var(--text-primary)] font-medium truncate max-w-[220px]">
                  {doc.filename}
                </td>
                <td className="py-2.5 pr-4">
                  <Badge>{TYPE_LABELS[doc.type] ?? doc.type.toUpperCase()}</Badge>
                </td>
                <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{formatBytes(doc.size)}</td>
                <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{formatDate(doc.uploaded_at)}</td>
                <td className="py-2.5 text-right">
                  <Button
                    variant="danger"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => handleDelete(doc.doc_id)}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
