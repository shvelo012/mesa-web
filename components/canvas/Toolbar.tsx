"use client";

import { useState } from "react";
import { useCanvasStore, ToolMode } from "@/store/canvas.store";
import { MousePointer2, Square, Minus, Eraser, Save, Loader2, Undo2, Redo2, Keyboard } from "lucide-react";

const TOOLS: { id: ToolMode; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { id: "select", label: "Select", icon: <MousePointer2 size={14} />, shortcut: "S" },
  { id: "table", label: "Add Table", icon: <Square size={14} />, shortcut: "T" },
  { id: "wall", label: "Draw Wall", icon: <Minus size={14} />, shortcut: "W" },
  { id: "erase", label: "Erase", icon: <Eraser size={14} />, shortcut: "E" },
];

const SHORTCUTS = [
  { key: "S", desc: "Select tool" },
  { key: "T", desc: "Add Table tool" },
  { key: "W", desc: "Draw Wall tool" },
  { key: "E", desc: "Erase tool" },
  { key: "Del / ⌫", desc: "Delete selected table" },
  { key: "Esc", desc: "Deselect" },
  { key: "Ctrl+Z", desc: "Undo" },
  { key: "Ctrl+Y", desc: "Redo" },
  { key: "Ctrl+S", desc: "Save layout" },
];

interface Props {
  onSave: () => void;
  saving: boolean;
}

export default function Toolbar({ onSave, saving }: Props) {
  const { tool, setTool, isDirty, tables, past, future, undo, redo } = useCanvasStore();
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.625rem 1rem",
        background: "#ffffff",
        borderBottom: "1px solid rgba(24,22,15,0.08)",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          title={`${t.label} (${t.shortcut})`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.35rem 0.75rem",
            fontSize: "0.8125rem",
            fontWeight: 500,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            border: "1px solid",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.15s",
            background: tool === t.id ? "#fef2ec" : "#f5f3ef",
            borderColor: tool === t.id ? "rgba(196,65,12,0.4)" : "rgba(24,22,15,0.1)",
            color: tool === t.id ? "#c4410c" : "#5c5248",
          }}
        >
          {t.icon}
          {t.label}
          <kbd style={{
            fontSize: "0.6rem",
            fontFamily: "monospace",
            padding: "0.05rem 0.3rem",
            borderRadius: "3px",
            border: `1px solid ${tool === t.id ? "rgba(196,65,12,0.3)" : "rgba(24,22,15,0.15)"}`,
            color: tool === t.id ? "#c4410c" : "#9a9088",
            marginLeft: "0.1rem",
          }}>
            {t.shortcut}
          </kbd>
        </button>
      ))}

      <div style={{ width: "1px", height: "20px", background: "rgba(24,22,15,0.1)", margin: "0 0.25rem" }} />

      <button
        onClick={undo}
        disabled={past.length === 0}
        title="Undo (Ctrl+Z)"
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0.375rem 0.5rem",
          border: "1px solid rgba(24,22,15,0.1)",
          borderRadius: "6px",
          cursor: past.length > 0 ? "pointer" : "not-allowed",
          background: "#f5f3ef",
          color: past.length > 0 ? "#5c5248" : "#c8c4be",
          transition: "color 0.15s",
        }}
      >
        <Undo2 size={14} />
      </button>

      <button
        onClick={redo}
        disabled={future.length === 0}
        title="Redo (Ctrl+Y)"
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0.375rem 0.5rem",
          border: "1px solid rgba(24,22,15,0.1)",
          borderRadius: "6px",
          cursor: future.length > 0 ? "pointer" : "not-allowed",
          background: "#f5f3ef",
          color: future.length > 0 ? "#5c5248" : "#c8c4be",
          transition: "color 0.15s",
        }}
      >
        <Redo2 size={14} />
      </button>

      <span style={{ fontSize: "0.75rem", color: "#9a9088", marginLeft: "0.25rem" }}>
        {tables.length} table{tables.length !== 1 ? "s" : ""}
      </span>

      <div style={{ flex: 1 }} />

      {/* Shortcuts legend */}
      <button
        onClick={() => setShowShortcuts((v) => !v)}
        title="Keyboard shortcuts"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          padding: "0.375rem 0.625rem",
          border: "1px solid rgba(24,22,15,0.1)",
          borderRadius: "6px",
          cursor: "pointer",
          background: showShortcuts ? "#f0ede8" : "#f5f3ef",
          color: "#5c5248",
          fontSize: "0.8125rem",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <Keyboard size={14} />
      </button>

      {showShortcuts && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: "1rem",
            zIndex: 50,
            background: "#ffffff",
            border: "1px solid rgba(24,22,15,0.12)",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            padding: "0.875rem 1rem",
            width: "220px",
          }}
        >
          <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.625rem" }}>
            Keyboard Shortcuts
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {SHORTCUTS.map(({ key, desc }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.8125rem", color: "#5c5248" }}>{desc}</span>
                <kbd style={{ fontSize: "0.7rem", fontFamily: "monospace", padding: "0.1rem 0.4rem", borderRadius: "4px", background: "#f0ede8", border: "1px solid rgba(24,22,15,0.15)", color: "#18160f", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onSave}
        disabled={!isDirty || saving}
        title="Save (Ctrl+S)"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.375rem 1rem",
          fontSize: "0.8125rem",
          fontWeight: 600,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          border: "1px solid",
          borderRadius: "6px",
          cursor: isDirty && !saving ? "pointer" : "not-allowed",
          transition: "all 0.15s",
          background: isDirty ? "#c4410c" : "#f5f3ef",
          borderColor: isDirty ? "#c4410c" : "rgba(24,22,15,0.1)",
          color: isDirty ? "#ffffff" : "#9a9088",
          opacity: isDirty ? 1 : 0.6,
        }}
      >
        {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
        Save
      </button>
    </div>
  );
}
