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
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const { setTables, setWalls, tables, walls, markClean } = useCanvasStore();
  const [floor, setFloor] = useState<Floor | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user || user.role !== "RESTAURANT_OWNER") { router.push("/login"); return; }
    api.get(`/floors/${floorId}`).then(({ data }) => {
      setFloor(data);
      setTables(data.tables || []);
      setWalls(data.walls || []);
    });
  }, [floorId, user, _hasHydrated]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.post(`/floors/${floorId}/layout`, { tables, walls });
      markClean();
      setSaveMsg("Saved");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch {
      setSaveMsg("Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!floor) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f3ef" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid #f0ede8", borderTopColor: "#c4410c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f5f3ef" }}>
      {/* Editor top bar */}
      <div
        style={{
          background: "#ffffff",
          borderBottom: "1px solid rgba(24,22,15,0.09)",
          padding: "0 1.25rem",
          height: "56px",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => router.push("/dashboard")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9088", fontSize: "0.875rem", fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.35rem", transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#18160f")}
          onMouseLeave={e => (e.currentTarget.style.color = "#9a9088")}
        >
          ← Dashboard
        </button>

        <div style={{ width: "1px", height: "18px", background: "rgba(24,22,15,0.1)" }} />

        <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.01em" }}>
          {floor.name}
        </span>

        <span
          style={{
            fontSize: "0.6875rem",
            fontWeight: 600,
            color: "#5c5248",
            background: "#f0ede8",
            padding: "0.2rem 0.625rem",
            borderRadius: "999px",
          }}
        >
          {floor.sectionType}
        </span>

        <div style={{ flex: 1 }} />

        {saveMsg && (
          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: saveMsg === "Saved" ? "#16a34a" : "#dc2626" }}>
            {saveMsg === "Saved" ? "✓ Saved" : "⚠ Save failed"}
          </span>
        )}
      </div>

      {/* Toolbar */}
      <Toolbar onSave={handleSave} saving={saving} />

      {/* Canvas + properties */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div
          style={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            background: "#edeae5",
            backgroundImage: "radial-gradient(circle, rgba(24,22,15,0.07) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          <div
            style={{
              width: floor.width,
              height: floor.height,
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 4px 24px rgba(24,22,15,0.15), 0 1px 4px rgba(24,22,15,0.1)",
            }}
          >
            <FloorCanvas width={floor.width} height={floor.height} bgColor={floor.bgColor} />
          </div>
        </div>

        <aside
          style={{
            width: "260px",
            flexShrink: 0,
            background: "#ffffff",
            borderLeft: "1px solid rgba(24,22,15,0.09)",
            overflowY: "auto",
          }}
        >
          <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid rgba(24,22,15,0.08)", background: "#fafaf8" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Properties
            </p>
          </div>
          <TableProperties />
        </aside>
      </div>
    </div>
  );
}
