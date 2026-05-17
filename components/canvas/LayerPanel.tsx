"use client";

import { useCanvasStore } from "@/store/canvas.store";

export default function LayerPanel() {
  const { tables, walls, selectedId, hiddenIds, setSelectedId, toggleHidden, removeTable, removeWall } = useCanvasStore();

  return (
    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
      {/* Tables */}
      <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(24,22,15,0.08)", background: "#fafaf8" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            Tables
          </p>
          <span style={{ fontSize: "0.75rem", color: "#c8c4be", fontWeight: 600 }}>{tables.length}</span>
        </div>
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        {tables.length === 0 && (
          <div style={{ padding: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.8125rem", color: "#c8c4be" }}>No tables</p>
          </div>
        )}
        {tables.map((t) => {
          const isHidden = hiddenIds.has(t.id);
          const isSelected = selectedId === t.id;
          return (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.875rem",
                borderBottom: "1px solid rgba(24,22,15,0.04)",
                background: isSelected ? "rgba(196,65,12,0.05)" : "transparent",
                opacity: isHidden ? 0.4 : 1,
                cursor: "pointer",
                transition: "background 0.1s",
              }}
              onClick={() => setSelectedId(isSelected ? null : t.id)}
            >
              {/* Shape icon */}
              <div style={{
                width: t.shape === "CIRCLE" ? 14 : 12,
                height: t.shape === "CIRCLE" ? 14 : 10,
                background: t.isWindowSeat ? "#bfdbfe" : t.shape === "CIRCLE" ? "#fde68a" : "#bbf7d0",
                border: `1px solid ${isSelected ? "#c4410c" : "rgba(24,22,15,0.2)"}`,
                borderRadius: t.shape === "CIRCLE" ? "50%" : "2px",
                flexShrink: 0,
              }} />

              <span style={{ fontSize: "0.8125rem", fontWeight: isSelected ? 600 : 400, color: "#18160f", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.label}
              </span>

              <span style={{ fontSize: "0.7rem", color: "#9a9088" }}>{t.capacity}p</span>

              {/* Visibility toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleHidden(t.id); }}
                title={isHidden ? "Show" : "Hide"}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0.1rem", color: isHidden ? "#c8c4be" : "#9a9088", lineHeight: 1, fontSize: "0.875rem" }}
              >
                {isHidden ? "○" : "●"}
              </button>

              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); removeTable(t.id); }}
                title="Delete table"
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0.1rem", color: "#c8c4be", lineHeight: 1, fontSize: "0.875rem" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#c8c4be")}
              >
                ×
              </button>
            </div>
          );
        })}

        {/* Walls section */}
        {walls.length > 0 && (
          <>
            <div style={{ padding: "0.625rem 0.875rem 0.375rem", background: "#fafaf8", borderTop: "1px solid rgba(24,22,15,0.08)", borderBottom: "1px solid rgba(24,22,15,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                  Walls
                </p>
                <span style={{ fontSize: "0.75rem", color: "#c8c4be", fontWeight: 600 }}>{walls.length}</span>
              </div>
            </div>
            {walls.map((w, i) => {
              const isHidden = hiddenIds.has(w.id);
              const len = Math.round(Math.hypot(w.x2 - w.x1, w.y2 - w.y1));
              return (
                <div
                  key={w.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0.875rem",
                    borderBottom: "1px solid rgba(24,22,15,0.04)",
                    opacity: isHidden ? 0.4 : 1,
                  }}
                >
                  <div style={{ width: 16, height: 3, background: "#475569", borderRadius: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.8125rem", color: "#18160f", flex: 1 }}>Wall {i + 1}</span>
                  <span style={{ fontSize: "0.7rem", color: "#9a9088" }}>{len}px</span>
                  <button
                    onClick={() => toggleHidden(w.id)}
                    title={isHidden ? "Show" : "Hide"}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "0.1rem", color: isHidden ? "#c8c4be" : "#9a9088", lineHeight: 1, fontSize: "0.875rem" }}
                  >
                    {isHidden ? "○" : "●"}
                  </button>
                  <button
                    onClick={() => removeWall(w.id)}
                    title="Delete wall"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "0.1rem", color: "#c8c4be", lineHeight: 1, fontSize: "0.875rem" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#c8c4be")}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
