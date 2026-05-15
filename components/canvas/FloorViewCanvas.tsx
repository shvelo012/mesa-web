"use client";

import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Rect, Line, Group } from "react-konva";
import Konva from "konva";
import { Floor, TableItem } from "@/types";
import TableShape from "./TableShape";

interface Props {
  floor: Floor;
  selectedTableId: string | null;
  onSelectTable: (table: TableItem) => void;
  partySize?: number;
  tableBookings?: Record<string, { startTime: string; endTime: string }[]>;
  occupiedIds?: Set<string>;
}

export default function FloorViewCanvas({
  floor,
  selectedTableId,
  onSelectTable,
  partySize,
  tableBookings,
  occupiedIds,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    tableId: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / floor.width));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [floor.width]);

  const setCursor = (stage: Konva.Stage | null, cursor: string) => {
    if (stage) stage.container().style.cursor = cursor;
  };

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      <Stage
        width={floor.width * scale}
        height={floor.height * scale}
        scaleX={scale}
        scaleY={scale}
        onMouseMove={(e) => {
          const el = containerRef.current;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          setTooltip((prev) =>
            prev
              ? {
                  ...prev,
                  x: e.evt.clientX - rect.left + 10,
                  y: e.evt.clientY - rect.top + 10,
                }
              : null,
          );
        }}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={floor.width}
            height={floor.height}
            fill={floor.bgColor}
          />

          {(floor.walls || []).map((w) => (
            <Line
              key={w.id}
              points={[w.x1, w.y1, w.x2, w.y2]}
              stroke="#8c8480"
              strokeWidth={5}
              lineCap="round"
              listening={false}
            />
          ))}

          {(floor.tables || []).map((t) => {
            const isSelected = t.id === selectedTableId;
            const isHovered = t.id === hoveredId;
            const tooSmall = partySize !== undefined && t.capacity < partySize;
            const available = t.isActive && !tooSmall;

            const fill = !t.isActive
              ? "#e5e2dd"
              : tooSmall
                ? "#f0ede8"
                : isSelected
                  ? "#fde8df"
                  : isHovered
                    ? t.isWindowSeat
                      ? "#93c5fd"
                      : t.shape === "CIRCLE"
                        ? "#fde68a"
                        : "#86efac"
                    : t.isWindowSeat
                      ? "#dbeafe"
                      : t.shape === "CIRCLE"
                        ? "#fef9c3"
                        : "#dcfce7";

            const stroke = isSelected
              ? "#c4410c"
              : isHovered && available
                ? "#475569"
                : available
                  ? "#a8a09a"
                  : "#c8c4be";

            return (
              <Group
                key={t.id}
                x={t.x}
                y={t.y}
                rotation={t.rotation}
                onClick={() => available && onSelectTable(t)}
                onTap={() => available && onSelectTable(t)}
                onMouseEnter={(e) => {
                  setCursor(
                    e.target.getStage(),
                    available ? "pointer" : "not-allowed",
                  );
                  if (available) setHoveredId(t.id);
                  const el = containerRef.current;
                  if (el) {
                    const rect = el.getBoundingClientRect();
                    setTooltip({
                      tableId: t.id,
                      x: e.evt.clientX - rect.left + 10,
                      y: e.evt.clientY - rect.top + 10,
                    });
                  }
                }}
                onMouseLeave={(e) => {
                  setCursor(e.target.getStage(), "default");
                  setHoveredId(null);
                  setTooltip(null);
                }}
              >
                <TableShape
                  table={t}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isSelected ? 2 : 1}
                  textColor={available ? "#1e293b" : "#94a3b8"}
                  dimChairs={!available}
                  opacity={available ? 1 : 0.85}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>

      {/* Tooltip */}
      {tooltip &&
        (() => {
          const t = floor.tables?.find((tbl) => tbl.id === tooltip.tableId);
          if (!t) return null;
          const bookings = tableBookings?.[t.id] || [];
          const isOccupied = occupiedIds?.has(t.id);
          const tooSmall = partySize !== undefined && t.capacity < partySize;
          const isInactive = !t.isActive && !isOccupied;
          return (
            <div
              style={{
                position: "absolute",
                left: tooltip.x,
                top: tooltip.y,
                zIndex: 50,
                background: "#ffffff",
                border: "1px solid rgba(24,22,15,0.1)",
                borderRadius: "6px",
                padding: "0.5rem 0.75rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: "0.75rem",
                color: "#5c5248",
                pointerEvents: "none",
                maxWidth: "220px",
                lineHeight: 1.4,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  color: "#18160f",
                  marginBottom: "0.25rem",
                }}
              >
                Table {t.label} · {t.capacity}p
              </div>
              {isOccupied && (
                <div
                  style={{
                    color: "#dc2626",
                    fontWeight: 600,
                    marginBottom: "0.25rem",
                  }}
                >
                  Booked at selected time
                </div>
              )}
              {tooSmall && (
                <div
                  style={{
                    color: "#b45309",
                    fontWeight: 600,
                    marginBottom: "0.25rem",
                  }}
                >
                  Too small for party size
                </div>
              )}
              {isInactive && (
                <div
                  style={{
                    color: "#9a9088",
                    fontWeight: 600,
                    marginBottom: "0.25rem",
                  }}
                >
                  Table inactive
                </div>
              )}
              {bookings.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.125rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      color: "#9a9088",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Reservations today
                  </span>
                  {bookings.map((b, i) => (
                    <span key={i}>
                      {b.startTime} – {b.endTime}
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ color: "#9a9088" }}>No reservations today</span>
              )}
            </div>
          );
        })()}
    </div>
  );
}
