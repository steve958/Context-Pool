"use client";

import { useEffect, useRef } from "react";

export type WsEvent =
  | { type: "chunk_progress"; current: number; total: number }
  | { type: "synthesis_started" }
  | { type: "synthesis_finished" }
  | { type: "error"; message: string };

export function useRunWebSocket(runId: string | null, onEvent: (e: WsEvent) => void) {
  const ws = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!runId) return;
    const wsBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
      .replace(/^http/, "ws");

    // SEC-02: pass API key as query param (browsers cannot set WS headers)
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";
    const url = apiKey
      ? `${wsBase}/ws/query/${runId}?api_key=${encodeURIComponent(apiKey)}`
      : `${wsBase}/ws/query/${runId}`;

    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onmessage = (e) => {
      try {
        const event: WsEvent = JSON.parse(e.data);
        onEventRef.current(event);
      } catch {
        // ignore malformed frames
      }
    };

    return () => {
      socket.close();
      ws.current = null;
    };
  }, [runId]);
}
