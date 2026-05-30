"use client";

import { useEffect, useRef } from "react";
import { getAccessToken } from "../lib/api";

type Handler = (data: unknown) => void;

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export function useSSE(handlers: Record<string, Handler>) {
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    let cancelled = false;

    function connectSSE() {
      if (cancelled) return;

      const token = getAccessToken();
      if (!token) {
        // Access token not ready yet (silent refresh in progress) — retry shortly
        retryRef.current = setTimeout(connectSSE, 300);
        return;
      }

      const url = `${BASE}/events/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        retryCount.current = 0;
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (cancelled) return;
        const delay = Math.min(1000 * 2 ** retryCount.current, 30_000);
        retryCount.current++;
        retryRef.current = setTimeout(connectSSE, delay);
      };

      for (const [event, handler] of Object.entries(handlersRef.current)) {
        es.addEventListener(event, (e: MessageEvent) => {
          try {
            handlersRef.current[event]?.(JSON.parse(e.data));
          } catch {
            handlersRef.current[event]?.(e.data);
          }
          void handler;
        });
      }
    }

    connectSSE();

    return () => {
      cancelled = true;
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (retryRef.current) {
        clearTimeout(retryRef.current);
      }
    };
  }, []);
}
