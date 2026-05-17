"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastCtx {
  toast: (msg: string, type?: ToastType) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast outside ToastProvider");
  return ctx;
}

const STYLES = {
  success: { bg: "#f0fdf4", border: "rgba(22,163,74,0.25)", color: "#16a34a", icon: "✓" },
  error:   { bg: "#fef2f2", border: "rgba(220,38,38,0.25)",  color: "#dc2626", icon: "✕" },
  warning: { bg: "#fffbeb", border: "rgba(180,83,9,0.25)",   color: "#b45309", icon: "⚠" },
  info:    { bg: "#eff6ff", border: "rgba(37,99,235,0.25)",  color: "#2563eb", icon: "ℹ" },
};

function ToastEntry({ item, onRemove }: { item: ToastItem; onRemove: () => void }) {
  const s = STYLES[item.type];
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timer.current = setTimeout(onRemove, 4500);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [onRemove]);

  return (
    <div
      style={{
        display: "flex", alignItems: "flex-start", gap: "0.625rem",
        padding: "0.75rem 1rem",
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: "10px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)",
        animation: "toastIn 0.25s cubic-bezier(0.16,1,0.3,1) both",
        maxWidth: "360px",
        width: "100%",
        pointerEvents: "auto",
      }}
    >
      <span style={{ color: s.color, fontWeight: 700, flexShrink: 0, fontSize: "0.875rem", marginTop: "0.05rem" }}>
        {s.icon}
      </span>
      <p style={{ fontSize: "0.875rem", color: "#18160f", flex: 1, lineHeight: 1.45, margin: 0 }}>
        {item.message}
      </p>
      <button
        onClick={onRemove}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9088", fontSize: "1.125rem", lineHeight: 1, padding: "0", flexShrink: 0, marginTop: "-1px" }}
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((ts) => [...ts.slice(-4), { id, type, message }]);
  }, []);

  const value: ToastCtx = {
    toast: add,
    success: (m) => add(m, "success"),
    error: (m) => add(m, "error"),
    warning: (m) => add(m, "warning"),
    info: (m) => add(m, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end", pointerEvents: "none" }}>
        {toasts.map((t) => (
          <ToastEntry key={t.id} item={t} onRemove={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
