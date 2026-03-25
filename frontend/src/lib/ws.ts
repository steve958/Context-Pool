"use client";

import { useEffect, useRef } from "react";

export type WsEvent =
  | { type: "chunk_progress"; current: number; total: number }
  | { type: "synthesis_started" }
  | { type: "synthesis_finished" }
  | { type: "error"; message: string };

export function useRunWebSocket(runId: string | null, onEvent: (e: WsEvent) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  // Stable ref so reconnect loop can check if we've been unmounted or finished
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (!runId) return;
    stoppedRef.current = false;

    const wsBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
      .replace(/^https/, "wss")
      .replace(/^http/, "ws");

    const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";
    const url = apiKey
      ? `${wsBase}/ws/query/${runId}?api_key=${encodeURIComponent(apiKey)}`
      : `${wsBase}/ws/query/${runId}`;

    let socket: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (stoppedRef.current) return;

      socket = new WebSocket(url);

      socket.onmessage = (e) => {
        try {
          const event: WsEvent = JSON.parse(e.data);
          onEventRef.current(event);
          // Terminal events — stop reconnecting
          if (event.type === "synthesis_finished" || event.type === "error") {
            stoppedRef.current = true;
          }
        } catch {
          // ignore malformed frames
        }
      };

      socket.onclose = (e) => {
        // 1000 = normal close (server finished), 1008 = policy violation (auth)
        // For anything else, reconnect after a short delay
        if (stoppedRef.current || e.code === 1000 || e.code === 1008) return;
        reconnectTimer = setTimeout(connect, 2000);
      };

      // onerror always fires before onclose — reconnect is handled in onclose
      socket.onerror = () => {};
    }

    connect();

    return () => {
      stoppedRef.current = true;
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [runId]);
}
