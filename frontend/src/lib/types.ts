/**
 * TypeScript type definitions for Context Pool API.
 */

// ============================================================================
// Workspaces
// ============================================================================

export interface Workspace {
  ws_id: string;
  name: string;
  document_count: number;
  created_at?: string;
}

export interface CreateWorkspaceRequest {
  name: string;
}

// ============================================================================
// Documents
// ============================================================================

export interface Document {
  doc_id: string;
  filename: string;
  size: number;
  type: string;
  uploaded_at: string;
}

// ============================================================================
// Query Runs
// ============================================================================

export interface Citation {
  doc_id: string;
  chunk_id: string;
  quote: string;
  page_marker: string;
  heading_path: string;
}

export interface TokenUsageDetail {
  input_tokens: number;
  output_tokens: number;
}

export interface TokenUsage {
  scan_total: TokenUsageDetail | null;
  synthesis: TokenUsageDetail | null;
  overall: TokenUsageDetail | null;
}

export interface QueryResult {
  final_answer: string;
  citations: Citation[];
  token_usage: TokenUsage;
}

export interface PoolHit {
  chunk_id: string;
  doc_id: string;
  answer: string;
  evidence_quotes: string[];
  heading_path?: string;
  page_marker?: string;
}

// ============================================================================
// History / Persisted Runs
// ============================================================================

export interface RunMetadata {
  run_id: string;
  question: string;
  created_at: string;
  status: 'complete' | 'failed';
  document_count: number;
  positive_hits: number;
}

export interface RunConfigSnapshot {
  provider: string;
  model: string;
  max_chunk_tokens: number;
  context_window_tokens: number;
}

export interface RunDetail {
  run_id: string;
  workspace_id: string;
  doc_id: string | null;
  question: string;
  created_at: string;
  completed_at: string;
  status: 'complete' | 'failed';
  config_snapshot: RunConfigSnapshot;
  result: QueryResult | null;
  pool: PoolHit[];
}

export interface RunListResponse {
  runs: RunMetadata[];
  total: number;
  limit: number;
  offset: number;
}

export interface RerunResponse {
  run_id: string;
  message: string;
}

export interface ClearRunsResponse {
  deleted: number;
}

// ============================================================================
// Settings
// ============================================================================

export interface Settings {
  provider: string;
  api_key_set: boolean;
  model: string;
  context_window_tokens: number;
  max_chunk_tokens: number;
  timeouts: {
    chunk_call_seconds: number;
    synthesis_seconds: number;
  };
  temperatures: {
    scanning: number;
    synthesis: number;
  };
  ollama_base_url: string;
}

export interface UpdateSettingsRequest {
  provider?: string;
  api_key?: string;
  model?: string;
  context_window_tokens?: number;
  max_chunk_tokens?: number;
  timeouts?: {
    chunk_call_seconds?: number;
    synthesis_seconds?: number;
  };
  temperatures?: {
    scanning?: number;
    synthesis?: number;
  };
  ollama_base_url?: string;
}

// ============================================================================
// Query Request
// ============================================================================

export interface QueryRequest {
  workspace_id: string;
  doc_id: string | null;
  question: string;
  ocr_enabled: boolean;
  eml_scope: 'body' | 'attachments' | 'both';
  system_prompt_extra?: string | null;
}

export interface QueryRunResponse {
  run_id: string;
}

export interface QueryStatusResponse {
  status: 'pending' | 'scanning' | 'synthesizing' | 'complete' | 'failed';
  error?: string;
}

// ============================================================================
// WebSocket Events
// ============================================================================

export type WebSocketEvent =
  | { type: 'chunk_progress'; current: number; total: number }
  | { type: 'synthesis_started' }
  | { type: 'synthesis_finished' }
  | { type: 'error'; message: string };
