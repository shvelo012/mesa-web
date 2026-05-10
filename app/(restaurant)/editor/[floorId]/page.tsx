"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/store/auth.store";
import { useCanvasStore } from "@/store/canvas.store";
import { api } from "@/lib/api";
import { Floor } from "@/types";
import Toolbar from "@/components/canvas/Toolbar";
import TableProperties from "@/components/canvas/TableProperties";

const FloorCanvas = dynamic(() => import("@/components/canvas/FloorCanvas"), { ssr: false });

export default function EditorPage() {
  const { floorId } = useParams<{ floorId: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const { setTables, setWalls, tables, walls, markClean } = useCanvasStore();
  const [floor, setFloor] = useState<Floor | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (!user || user.role !== "RESTAURANT_OWNER") { router.push("/login"); return; }
    api.get(`/floors/${floorId}`).then(({ data }) => {
      setFloor(data);
      setTables(data.tables || []);
      setWalls(data.walls || []);
    });
  }, [floorId, user]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.post(`/floors/${floorId}/layout`, { tables, walls });
      markClean();
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch {
      setSaveMsg("Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!floor) return <div className="p-8 text-slate-500">Loading floor...</div>;

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3">
        <button onClick={() => router.push("/dashboard")} className="text-sm text-slate-500 hover:text-slate-900">
          ← Dashboard
        </button>
        <span className="text-slate-300">|</span>
        <span className="font-semibold text-slate-800">{floor.name}</span>
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{floor.sectionType}</span>
        {saveMsg && <span className="text-xs text-green-600 font-medium">{saveMsg}</span>}
      </div>

      <Toolbar onSave={handleSave} saving={saving} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
          <div
            className="shadow-lg rounded overflow-hidden"
            style={{ width: floor.width, height: floor.height }}
          >
            <FloorCanvas width={floor.width} height={floor.height} bgColor={floor.bgColor} />
          </div>
        </div>

        <aside className="w-64 bg-white border-l border-slate-200 overflow-y-auto">
          <div className="p-3 border-b border-slate-100">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Properties</p>
          </div>
          <TableProperties />
        </aside>
      </div>
    </div>
  );
}
