const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

// Workspaces
export const api = {
  workspaces: {
    list: () => request<{ workspaces: Workspace[] }>("/api/workspaces"),
    create: (name: string) =>
      request<Workspace>("/api/workspaces", { method: "POST", body: JSON.stringify({ name }) }),
    delete: (wsId: string) =>
      fetch(`${BASE}/api/workspaces/${wsId}`, { method: "DELETE", headers: authHeaders() }),
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
    delete: (wsId: string, docId: string) =>
      fetch(`${BASE}/api/workspaces/${wsId}/documents/${docId}`, {
        method: "DELETE",
        headers: authHeaders(),
      }),
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
};

// Types
export interface Workspace {
  ws_id: string;
  name: string;
  document_count: number;
  created_at?: string;
}

export interface Document {
  doc_id: string;
  filename: string;
  size: number;
  type: string;
  uploaded_at: string;
}

export interface QueryRequest {
  workspace_id: string;
  doc_id?: string | null;
  question: string;
  ocr_enabled?: boolean;
  eml_scope?: "body" | "attachments" | "both";
  system_prompt_extra?: string | null;
}

export interface Citation {
  doc_id: string;
  chunk_id: string;
  quote: string;
  page_marker?: string;
  heading_path?: string;
}

export interface QueryResult {
  final_answer: string;
  citations: Citation[];
  token_usage?: Record<string, unknown>;
}

export interface Settings {
  provider: string;
  api_key_set: boolean;
  model: string;
  context_window_tokens: number;
  max_chunk_tokens: number;
  timeouts: { chunk_call_seconds: number; synthesis_seconds: number };
  temperatures: { scanning: number; synthesis: number };
  ollama_base_url: string;
}
