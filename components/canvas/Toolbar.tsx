"use client";

import { useCanvasStore, ToolMode } from "@/store/canvas.store";
import { MousePointer2, Square, Minus, Eraser, Save, Loader2 } from "lucide-react";

const TOOLS: { id: ToolMode; label: string; icon: React.ReactNode }[] = [
  { id: "select", label: "Select", icon: <MousePointer2 size={15} /> },
  { id: "table", label: "Add Table", icon: <Square size={15} /> },
  { id: "wall", label: "Draw Wall", icon: <Minus size={15} /> },
  { id: "erase", label: "Erase", icon: <Eraser size={15} /> },
];

interface Props {
  onSave: () => void;
  saving: boolean;
}

export default function Toolbar({ onSave, saving }: Props) {
  const { tool, setTool, isDirty } = useCanvasStore();

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
      }}
    >
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.375rem 0.875rem",
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
        </button>
      ))}

      <div style={{ flex: 1 }} />

      <button
        onClick={onSave}
        disabled={!isDirty || saving}
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
        Save Layout
      </button>
    </div>
  );
}
