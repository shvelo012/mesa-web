"use client";

import { Stage, Layer, Rect, Circle, Line, Group, Text } from "react-konva";
import { Floor, TableItem } from "@/types";

interface Props {
  floor: Floor;
  selectedTableId: string | null;
  onSelectTable: (table: TableItem) => void;
}

export default function FloorViewCanvas({ floor, selectedTableId, onSelectTable }: Props) {
  return (
    <Stage width={floor.width} height={floor.height}>
      <Layer>
        <Rect x={0} y={0} width={floor.width} height={floor.height} fill={floor.bgColor} />

        {(floor.walls || []).map((w) => (
          <Line
            key={w.id}
            points={[w.x1, w.y1, w.x2, w.y2]}
            stroke="#8c8480"
            strokeWidth={5}
            lineCap="round"
          />
        ))}

        {(floor.tables || []).map((t) => {
          const isSelected = t.id === selectedTableId;
          const available = t.isActive;
          const fill = !available
            ? "#e5e2dd"
            : isSelected
            ? "#fde8df"
            : t.isWindowSeat
            ? "#dbeafe"
            : t.shape === "CIRCLE"
            ? "#fef9c3"
            : "#dcfce7";
          const stroke = isSelected ? "#c4410c" : available ? "#a8a09a" : "#c8c4be";

          return (
            <Group
              key={t.id}
              x={t.x}
              y={t.y}
              rotation={t.rotation}
              onClick={() => available && onSelectTable(t)}
              style={{ cursor: available ? "pointer" : "not-allowed" }}
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
                text={`${t.label}\n${t.capacity}p`}
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
  );
}
