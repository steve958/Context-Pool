"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Workspace } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";

export default function WorkspacesPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const res = await api.workspaces.list();
      setWorkspaces(res.workspaces);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const ws = await api.workspaces.create(newName.trim());
      setModalOpen(false);
      setNewName("");
      router.push(`/workspace/${ws.ws_id}/documents`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create workspace");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.workspaces.delete(deleteTarget.ws_id);
      setWorkspaces((prev) => prev.filter((w) => w.ws_id !== deleteTarget.ws_id));
      setDeleteTarget(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete workspace");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Context Pool</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Select or create a workspace</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>New workspace</Button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        )}

        {!loading && workspaces.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-[var(--text-muted)] text-sm">No workspaces yet</p>
            <Button variant="ghost" onClick={() => setModalOpen(true)}>
              Create your first workspace →
            </Button>
          </div>
        )}

        {!loading && workspaces.length > 0 && (
          <div className="grid gap-3">
            {workspaces.map((ws) => (
              <Card
                key={ws.ws_id}
                hoverable
                onClick={() => router.push(`/workspace/${ws.ws_id}/documents`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{ws.name}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {ws.document_count} document{ws.document_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(ws); }}
                      className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete workspace"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                      </svg>
                    </button>
                    <span className="text-[var(--text-muted)] text-sm">→</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create workspace modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setNewName(""); }} title="New workspace">
        <div className="flex flex-col gap-4">
          <Input
            label="Workspace name"
            placeholder="e.g. Q4 Reports"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setModalOpen(false); setNewName(""); }}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating} disabled={!newName.trim()}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete workspace">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-[var(--text-primary)]">{deleteTarget?.name}</span>?
            This will permanently remove all {deleteTarget?.document_count} document
            {deleteTarget?.document_count !== 1 ? "s" : ""} and cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete workspace</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
