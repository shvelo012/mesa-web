"use client";

import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Rect, Circle, Line, Group, Text } from "react-konva";
import Konva from "konva";
import { Floor, TableItem } from "@/types";

interface Props {
  floor: Floor;
  selectedTableId: string | null;
  onSelectTable: (table: TableItem) => void;
  partySize?: number;
}

export default function FloorViewCanvas({ floor, selectedTableId, onSelectTable, partySize }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
    <div ref={containerRef} style={{ width: "100%" }}>
      <Stage
        width={floor.width * scale}
        height={floor.height * scale}
        scaleX={scale}
        scaleY={scale}
      >
        <Layer>
          <Rect x={0} y={0} width={floor.width} height={floor.height} fill={floor.bgColor} />

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
              ? (t.isWindowSeat ? "#93c5fd" : t.shape === "CIRCLE" ? "#fde68a" : "#86efac")
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
                onMouseEnter={(e) => {
                  setCursor(e.target.getStage(), available ? "pointer" : "not-allowed");
                  if (available) setHoveredId(t.id);
                }}
                onMouseLeave={(e) => {
                  setCursor(e.target.getStage(), "default");
                  setHoveredId(null);
                }}
              >
                {t.shape === "CIRCLE" ? (
                  <Circle
                    x={t.width / 2}
                    y={t.height / 2}
                    radius={Math.min(t.width, t.height) / 2}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                ) : (
                  <Rect
                    width={t.width}
                    height={t.height}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isSelected ? 2 : 1}
                    cornerRadius={3}
                  />
                )}
                <Text
                  text={tooSmall ? `${t.label}\n${t.capacity}p max` : `${t.label}\n${t.capacity}p`}
                  width={t.width}
                  height={t.height}
                  align="center"
                  verticalAlign="middle"
                  fontSize={10}
                  fill={available ? "#1e293b" : "#94a3b8"}
                  fontStyle="bold"
                  listening={false}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
