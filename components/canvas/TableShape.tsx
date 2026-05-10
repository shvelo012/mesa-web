"use client";

import { Rect, Circle, Group, Text } from "react-konva";
import { TableItem } from "@/types";

const CHAIR_W = 14;
const CHAIR_H = 11;
const CHAIR_OFFSET = 11;
export const CHAIR_PAD = 18;

export interface ChairPos {
  x: number;
  y: number;
  rot: number;
}

export function getChairPositions(table: TableItem): ChairPos[] {
  const { width: w, height: h, capacity, shape } = table;
  const cap = Math.max(0, capacity);

  if (shape === "CIRCLE") {
    if (cap === 0) return [];
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2;
    const offset = r + CHAIR_OFFSET;
    const positions: ChairPos[] = [];
    for (let i = 0; i < cap; i++) {
      const angle = (i / cap) * 2 * Math.PI - Math.PI / 2;
      positions.push({
        x: cx + Math.cos(angle) * offset,
        y: cy + Math.sin(angle) * offset,
        rot: (angle * 180) / Math.PI + 90,
      });
    }
    return positions;
  }

  const longHorizontal = w >= h;
  const sideMax = [
    Math.max(1, Math.floor(w / 45)),
    Math.max(1, Math.floor(w / 45)),
    Math.max(1, Math.floor(h / 45)),
    Math.max(1, Math.floor(h / 45)),
  ];
  const order = longHorizontal ? [0, 1, 2, 3] : [2, 3, 0, 1];
  const counts = [0, 0, 0, 0];
  let remaining = cap;
  let safety = 200;
  while (remaining > 0 && safety-- > 0) {
    let placed = false;
    for (const i of order) {
      if (remaining === 0) break;
      if (counts[i] < sideMax[i]) {
        counts[i]++;
        remaining--;
        placed = true;
      }
    }
    if (!placed) break;
  }

  const positions: ChairPos[] = [];
  for (let i = 0; i < counts[0]; i++) {
    positions.push({ x: (w * (i + 1)) / (counts[0] + 1), y: -CHAIR_OFFSET, rot: 0 });
  }
  for (let i = 0; i < counts[1]; i++) {
    positions.push({ x: (w * (i + 1)) / (counts[1] + 1), y: h + CHAIR_OFFSET, rot: 180 });
  }
  for (let i = 0; i < counts[2]; i++) {
    positions.push({ x: -CHAIR_OFFSET, y: (h * (i + 1)) / (counts[2] + 1), rot: -90 });
  }
  for (let i = 0; i < counts[3]; i++) {
    positions.push({ x: w + CHAIR_OFFSET, y: (h * (i + 1)) / (counts[3] + 1), rot: 90 });
  }
  return positions;
}

interface Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function tableBounds(t: TableItem): Bounds {
  return {
    x1: t.x - CHAIR_PAD,
    y1: t.y - CHAIR_PAD,
    x2: t.x + t.width + CHAIR_PAD,
    y2: t.y + t.height + CHAIR_PAD,
  };
}

function rectsOverlap(a: Bounds, b: Bounds): boolean {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

export function checkCollision(table: TableItem, others: TableItem[]): boolean {
  const a = tableBounds(table);
  return others.some((o) => o.id !== table.id && rectsOverlap(a, tableBounds(o)));
}

interface Props {
  table: TableItem;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  textColor?: string;
  opacity?: number;
  showWarning?: boolean;
  showLabel?: boolean;
  dimChairs?: boolean;
}

export default function TableShape({
  table,
  fill,
  stroke,
  strokeWidth = 1,
  textColor = "#1e293b",
  opacity = 1,
  showWarning = false,
  showLabel = true,
  dimChairs = false,
}: Props) {
  const tableFill =
    fill ?? (table.isWindowSeat ? "#dbeafe" : table.shape === "CIRCLE" ? "#fef9c3" : "#dcfce7");
  const tableStroke = stroke ?? "#a8a09a";
  const chairs = getChairPositions(table);
  const chairFill = dimChairs ? "#d6cfc6" : "#c9a17a";
  const chairStroke = dimChairs ? "#a8a09a" : "#7a5b3a";

  const isCircle = table.shape === "CIRCLE";
  const r = Math.min(table.width, table.height) / 2;

  return (
    <Group opacity={opacity}>
      {isCircle ? (
        <Circle
          x={table.width / 2 + 1}
          y={table.height / 2 + 2}
          radius={r}
          fill="rgba(24,22,15,0.14)"
          listening={false}
        />
      ) : (
        <Rect
          x={1}
          y={2}
          width={table.width}
          height={table.height}
          fill="rgba(24,22,15,0.14)"
          cornerRadius={3}
          listening={false}
        />
      )}

      {chairs.map((c, i) => (
        <Group key={i} x={c.x} y={c.y} rotation={c.rot} listening={false}>
          <Rect
            x={-CHAIR_W / 2}
            y={-CHAIR_H / 2 - 1}
            width={CHAIR_W}
            height={2.5}
            fill={dimChairs ? "#a8a09a" : "#7a5b3a"}
            cornerRadius={1}
          />
          <Rect
            x={-CHAIR_W / 2}
            y={-CHAIR_H / 2}
            width={CHAIR_W}
            height={CHAIR_H}
            fill={chairFill}
            stroke={chairStroke}
            strokeWidth={0.7}
            cornerRadius={3}
          />
          <Rect
            x={-CHAIR_W / 2 + 2}
            y={-CHAIR_H / 2 + 2}
            width={CHAIR_W - 4}
            height={CHAIR_H - 4}
            fill="rgba(255,255,255,0.25)"
            cornerRadius={2}
          />
        </Group>
      ))}

      {isCircle ? (
        <Circle
          x={table.width / 2}
          y={table.height / 2}
          radius={r}
          fill={tableFill}
          stroke={tableStroke}
          strokeWidth={strokeWidth}
        />
      ) : (
        <Rect
          width={table.width}
          height={table.height}
          fill={tableFill}
          stroke={tableStroke}
          strokeWidth={strokeWidth}
          cornerRadius={3}
        />
      )}

      {isCircle ? (
        <Circle
          x={table.width / 2}
          y={table.height / 2}
          radius={Math.max(2, r - 5)}
          fill="rgba(255,255,255,0.35)"
          listening={false}
        />
      ) : (
        <Rect
          x={3}
          y={3}
          width={Math.max(0, table.width - 6)}
          height={Math.max(0, table.height - 6)}
          fill="rgba(255,255,255,0.3)"
          cornerRadius={2}
          listening={false}
        />
      )}

      {showLabel && (
        <Text
          text={`${table.label}\n${table.capacity}p`}
          width={table.width}
          height={table.height}
          align="center"
          verticalAlign="middle"
          fontSize={11}
          fill={textColor}
          fontStyle="bold"
          listening={false}
        />
      )}

      {table.isWindowSeat && (
        <Text text="🪟" x={table.width - 16} y={2} fontSize={11} listening={false} />
      )}

      {showWarning &&
        (isCircle ? (
          <Circle
            x={table.width / 2}
            y={table.height / 2}
            radius={r + 5}
            stroke="#dc2626"
            strokeWidth={1.5}
            dash={[6, 4]}
            listening={false}
          />
        ) : (
          <Rect
            x={-5}
            y={-5}
            width={table.width + 10}
            height={table.height + 10}
            stroke="#dc2626"
            strokeWidth={1.5}
            dash={[6, 4]}
            cornerRadius={5}
            listening={false}
          />
        ))}
    </Group>
  );
}
