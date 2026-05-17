"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/store/auth.store";
import { useCanvasStore } from "@/store/canvas.store";
import { api } from "@/lib/api";
import { Floor } from "@/types";
import Toolbar from "@/components/canvas/Toolbar";
import TableProperties from "@/components/canvas/TableProperties";
import LayerPanel from "@/components/canvas/LayerPanel";

const FloorCanvas = dynamic(() => import("@/components/canvas/FloorCanvas"), { ssr: false });
const FloorViewCanvas = dynamic(() => import("@/components/canvas/FloorViewCanvas"), { ssr: false });

const TOOL_TIPS: Record<string, string> = {
  select: "Click a table to select it · Del / Backspace removes selected · Esc deselects",
  table: "Click anywhere on the canvas to place a new table · Ghost preview shows placement",
  wall: "Click and drag to draw a wall segment · Walls snap to 10 px grid",
  erase: "Click any table or wall to remove it instantly",
};

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

export default function EditorPage() {
  const { floorId } = useParams<{ floorId: string }>();
  const { user, _hasHydrated, can } = useAuthStore();
  const router = useRouter();
  const { setTables, setWalls, markClean } = useCanvasStore();
  const tool = useCanvasStore((s) => s.tool);
  const previewTables = useCanvasStore((s) => s.tables);
  const previewWalls = useCanvasStore((s) => s.walls);

  const [floor, setFloor] = useState<Floor | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "pending" | "saving" | "saved">("idle");
  const [zoom, setZoom] = useState(1);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [tipDismissed, setTipDismissed] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const prevToolRef = useRef(tool);
  const savingRef = useRef(saving);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  savingRef.current = saving;

  useEffect(() => {
    if (prevToolRef.current !== tool) {
      setTipDismissed(false);
      prevToolRef.current = tool;
    }
  }, [tool]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user || !can("FLOOR_PLAN")) { router.push("/login"); return; }
    api.get(`/floors/${floorId}`).then(({ data }) => {
      setFloor(data);
      setTables(data.tables || []);
      setWalls(data.walls || []);
    });
  }, [floorId, user, _hasHydrated]); // eslint-disable-line

  // Autosave: 3s after isDirty becomes true
  const isDirty = useCanvasStore((s) => s.isDirty);
  useEffect(() => {
    if (!isDirty) {
      setAutoSaveStatus("idle");
      return;
    }
    setAutoSaveStatus("pending");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (savingRef.current) return;
      setAutoSaveStatus("saving");
      const { tables, walls } = useCanvasStore.getState();
      try {
        await api.post(`/floors/${floorId}/layout`, { tables, walls });
        markClean();
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2500);
      } catch {
        setAutoSaveStatus("idle");
      }
    }, 3000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [isDirty, floorId, markClean]);

  // Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        const { isDirty } = useCanvasStore.getState();
        if (isDirty && !savingRef.current) handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  async function handleSave(): Promise<boolean> {
    const { tables, walls } = useCanvasStore.getState();
    setSaving(true);
    try {
      await api.post(`/floors/${floorId}/layout`, { tables, walls });
      markClean();
      setSaveMsg("Saved");
      setTimeout(() => setSaveMsg(""), 2000);
      return true;
    } catch {
      setSaveMsg("Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    if (useCanvasStore.getState().isDirty) {
      setShowUnsavedModal(true);
    } else {
      router.push("/dashboard");
    }
  }

  async function handleSaveAndLeave() {
    const ok = await handleSave();
    if (ok) router.push("/dashboard");
    else setShowUnsavedModal(false);
  }

  function stepZoom(dir: 1 | -1) {
    setZoom((z) => {
      const idx = ZOOM_LEVELS.indexOf(z);
      if (idx === -1) {
        const next = ZOOM_LEVELS.find((l) => dir === 1 ? l > z : l < z);
        const prev = [...ZOOM_LEVELS].reverse().find((l) => dir === -1 ? l < z : l > z);
        return (dir === 1 ? next : prev) ?? z;
      }
      const ni = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, idx + dir));
      return ZOOM_LEVELS[ni];
    });
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

      {/* Unsaved changes modal */}
      {showUnsavedModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowUnsavedModal(false); }}
        >
          <div style={{ background: "#ffffff", borderRadius: "12px", padding: "1.75rem", width: "360px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#18160f", marginBottom: "0.5rem" }}>
              Unsaved changes
            </h3>
            <p style={{ fontSize: "0.875rem", color: "#5c5248", marginBottom: "1.25rem", lineHeight: 1.5 }}>
              You have unsaved changes to this floor layout. What would you like to do?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button
                onClick={handleSaveAndLeave}
                disabled={saving}
                style={{ padding: "0.625rem 1rem", background: "#c4410c", color: "#fff", border: "none", borderRadius: "8px", fontFamily: "inherit", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
              >
                {saving ? "Saving…" : "Save & Leave"}
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                style={{ padding: "0.625rem 1rem", background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: "8px", fontFamily: "inherit", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
              >
                Discard changes
              </button>
              <button
                onClick={() => setShowUnsavedModal(false)}
                style={{ padding: "0.625rem 1rem", background: "#f5f3ef", color: "#5c5248", border: "none", borderRadius: "8px", fontFamily: "inherit", fontWeight: 500, fontSize: "0.875rem", cursor: "pointer" }}
              >
                Stay on page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
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
          onClick={handleBack}
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

        <span style={{ fontSize: "0.75rem", color: "#9a9088" }}>
          {floor.width} × {floor.height} px
        </span>

        <div style={{ flex: 1 }} />

        {/* Layer panel toggle */}
        <button
          onClick={() => setShowLayerPanel((v) => !v)}
          title="Layer panel"
          style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem", fontWeight: 500, fontFamily: "inherit", border: "1px solid rgba(24,22,15,0.12)", borderRadius: "6px", cursor: "pointer", background: showLayerPanel ? "#eff6ff" : "#f5f3ef", color: showLayerPanel ? "#2563eb" : "#5c5248" }}
        >
          Layers
        </button>

        {/* Preview mode toggle */}
        <button
          onClick={() => setPreviewMode((v) => !v)}
          title="Toggle guest preview"
          style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit", border: "1px solid", borderRadius: "6px", cursor: "pointer", background: previewMode ? "#c4410c" : "#f5f3ef", borderColor: previewMode ? "#c4410c" : "rgba(24,22,15,0.12)", color: previewMode ? "#fff" : "#5c5248" }}
        >
          {previewMode ? "✓ Preview" : "Preview"}
        </button>

        {saveMsg && (
          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: saveMsg === "Saved" ? "#16a34a" : "#dc2626" }}>
            {saveMsg === "Saved" ? "✓ Saved" : "⚠ Save failed"}
          </span>
        )}
        {!saveMsg && autoSaveStatus === "pending" && (
          <span style={{ fontSize: "0.8125rem", color: "#9a9088" }}>Unsaved changes</span>
        )}
        {!saveMsg && autoSaveStatus === "saving" && (
          <span style={{ fontSize: "0.8125rem", color: "#9a9088" }}>Autosaving…</span>
        )}
        {!saveMsg && autoSaveStatus === "saved" && (
          <span style={{ fontSize: "0.8125rem", color: "#16a34a", fontWeight: 500 }}>✓ Autosaved</span>
        )}
      </div>

      <Toolbar onSave={handleSave} saving={saving} />

      {/* Preview mode banner */}
      {previewMode && (
        <div style={{ padding: "0.4rem 1rem", background: "#fef2ec", borderBottom: "1px solid rgba(196,65,12,0.2)", fontSize: "0.75rem", color: "#c4410c", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span>Preview mode — showing guest view (read-only)</span>
          <button onClick={() => setPreviewMode(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c4410c", fontSize: "0.8125rem", fontFamily: "inherit", fontWeight: 600 }}>Exit preview</button>
        </div>
      )}

      {/* Contextual tip bar */}
      {!tipDismissed && !previewMode && (
        <div
          style={{
            padding: "0.4rem 1rem",
            background: "#fffaf5",
            borderBottom: "1px solid rgba(196,65,12,0.12)",
            fontSize: "0.75rem",
            color: "#5c5248",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexShrink: 0,
          }}
        >
          <span>
            <strong style={{ color: "#c4410c", marginRight: "0.375rem" }}>
              {tool.charAt(0).toUpperCase() + tool.slice(1)}:
            </strong>
            {TOOL_TIPS[tool]}
          </span>
          <button
            onClick={() => setTipDismissed(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9088", fontSize: "0.875rem", padding: "0 0.25rem", lineHeight: 1, fontFamily: "inherit" }}
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Canvas area */}
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
            position: "relative",
          }}
        >
          <div
            style={{
              width: floor.width * zoom,
              height: floor.height * zoom,
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 4px 24px rgba(24,22,15,0.15), 0 1px 4px rgba(24,22,15,0.1)",
              flexShrink: 0,
            }}
          >
            {previewMode ? (
              <FloorViewCanvas
                floor={{ ...floor, tables: previewTables, walls: previewWalls }}
                selectedTableId={null}
                onSelectTable={() => {}}
                partySize={2}
                occupiedIds={new Set()}
                tableBookings={{}}
              />
            ) : (
              <FloorCanvas width={floor.width} height={floor.height} bgColor={floor.bgColor} scale={zoom} />
            )}
          </div>

          {/* Zoom controls */}
          <div
            style={{
              position: "absolute",
              bottom: "1rem",
              right: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              background: "rgba(255,255,255,0.95)",
              border: "1px solid rgba(24,22,15,0.12)",
              borderRadius: "8px",
              padding: "0.25rem 0.375rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              backdropFilter: "blur(8px)",
            }}
          >
            <button
              onClick={() => stepZoom(-1)}
              disabled={zoom <= ZOOM_LEVELS[0]}
              title="Zoom out"
              style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: zoom > ZOOM_LEVELS[0] ? "pointer" : "not-allowed", color: zoom > ZOOM_LEVELS[0] ? "#18160f" : "#c8c4be", fontSize: "1rem", borderRadius: "4px", fontFamily: "inherit" }}
            >
              −
            </button>
            <button
              onClick={() => setZoom(1)}
              title="Reset to 100%"
              style={{ minWidth: "44px", height: "24px", border: "none", background: zoom === 1 ? "#f0ede8" : "none", cursor: "pointer", color: "#18160f", fontSize: "0.75rem", fontWeight: 600, fontFamily: "inherit", borderRadius: "4px" }}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => stepZoom(1)}
              disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
              title="Zoom in"
              style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: zoom < ZOOM_LEVELS[ZOOM_LEVELS.length - 1] ? "pointer" : "not-allowed", color: zoom < ZOOM_LEVELS[ZOOM_LEVELS.length - 1] ? "#18160f" : "#c8c4be", fontSize: "1rem", borderRadius: "4px", fontFamily: "inherit" }}
            >
              +
            </button>
          </div>
        </div>

        {/* Layer panel */}
        {showLayerPanel && (
          <aside
            style={{
              width: "200px",
              flexShrink: 0,
              background: "#ffffff",
              borderLeft: "1px solid rgba(24,22,15,0.09)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <LayerPanel />
          </aside>
        )}

        {/* Properties sidebar */}
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
