const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import type {
  Workspace,
  Document,
  QueryRequest,
  QueryResult,
  Settings,
  RunMetadata,
  RunDetail,
  RunListResponse,
  RerunResponse,
  ClearRunsResponse,
} from "./types";

function authHeaders(): Record<string, string> {
  const key = process.env.NEXT_PUBLIC_API_KEY || "";
  return key ? { "X-API-Key": key } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.detail || `HTTP ${res.status}`);
  }
}

// Workspaces
export const api = {
  workspaces: {
    list: () => request<{ workspaces: Workspace[] }>("/api/workspaces"),
    create: (name: string) =>
      request<Workspace>("/api/workspaces", { method: "POST", body: JSON.stringify({ name }) }),
    delete: (wsId: string) => del(`/api/workspaces/${wsId}`),
  },
  documents: {
    list: (wsId: string) =>
      request<{ documents: Document[] }>(`/api/workspaces/${wsId}/documents`),
    upload: (wsId: string, files: FileList) => {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("files", f));
      return fetch(`${BASE}/api/workspaces/${wsId}/documents`, {
        method: "POST",
        body: form,
        headers: authHeaders(),
      }).then((r) => r.json());
    },
    delete: (wsId: string, docId: string) => del(`/api/workspaces/${wsId}/documents/${docId}`),
  },
  query: {
    create: (body: QueryRequest) =>
      request<{ run_id: string }>("/api/query", { method: "POST", body: JSON.stringify(body) }),
    result: (runId: string) => request<QueryResult>(`/api/query/${runId}/result`),
    reportUrl: (runId: string) => `${BASE}/api/query/${runId}/report/html`,
  },
  settings: {
    get: () => request<Settings>("/api/settings"),
    patch: (patch: Partial<Settings>) =>
      request<{ ok: boolean }>("/api/settings", { method: "PATCH", body: JSON.stringify(patch) }),
  },
  history: {
    list: (wsId: string, limit = 50, offset = 0) =>
      request<RunListResponse>(`/api/workspaces/${wsId}/runs?limit=${limit}&offset=${offset}`),
    get: (wsId: string, runId: string) =>
      request<RunDetail>(`/api/workspaces/${wsId}/runs/${runId}`),
    delete: (wsId: string, runId: string) => del(`/api/workspaces/${wsId}/runs/${runId}`),
    clear: (wsId: string) =>
      request<ClearRunsResponse>(`/api/workspaces/${wsId}/runs`, { method: "DELETE" }),
    rerun: (wsId: string, runId: string) =>
      request<RerunResponse>(`/api/workspaces/${wsId}/runs/${runId}/rerun`, { method: "POST" }),
  },
};

// Re-export types for convenience
export type {
  Workspace,
  Document,
  QueryRequest,
  QueryResult,
  Settings,
  RunMetadata,
  RunDetail,
  RunListResponse,
  RerunResponse,
  ClearRunsResponse,
};

// Legacy type exports for backward compatibility
export interface Citation {
  doc_id: string;
  chunk_id: string;
  quote: string;
  page_marker?: string;
  heading_path?: string;
}
