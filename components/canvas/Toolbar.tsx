"use client";

import { useCanvasStore, ToolMode } from "@/store/canvas.store";
import { MousePointer2, Square, Minus, Eraser, Save, Loader2 } from "lucide-react";
import clsx from "clsx";

const TOOLS: { id: ToolMode; label: string; icon: React.ReactNode }[] = [
  { id: "select", label: "Select", icon: <MousePointer2 size={16} /> },
  { id: "table", label: "Add Table", icon: <Square size={16} /> },
  { id: "wall", label: "Draw Wall", icon: <Minus size={16} /> },
  { id: "erase", label: "Erase", icon: <Eraser size={16} /> },
];

interface Props {
  onSave: () => void;
  saving: boolean;
}

export default function Toolbar({ onSave, saving }: Props) {
  const { tool, setTool, isDirty } = useCanvasStore();

  return (
    <div className="flex items-center gap-2 p-2 bg-white border-b border-slate-200">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors",
            tool === t.id
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}

      <div className="flex-1" />

      <button
        onClick={onSave}
        disabled={!isDirty || saving}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white rounded text-sm font-medium disabled:opacity-50 hover:bg-green-700"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Save Layout
      </button>
    </div>
  );
}
