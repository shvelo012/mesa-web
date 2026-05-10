"use client";

import { useRef, useCallback, useId } from "react";
import { Stage, Layer, Rect, Circle, Line, Group, Text, Transformer } from "react-konva";
import Konva from "konva";
import { useCanvasStore } from "@/store/canvas.store";
import { TableItem, Wall } from "@/types";
import { TableShape } from "@/types";

interface Props {
  width: number;
  height: number;
  bgColor: string;
}

function TableNode({
  table,
  isSelected,
  onSelect,
  onChange,
}: {
  table: TableItem;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<TableItem>) => void;
}) {
  const shapeRef = useRef<Konva.Rect | Konva.Circle>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const fill = table.isWindowSeat ? "#bfdbfe" : table.shape === "CIRCLE" ? "#fde68a" : "#bbf7d0";
  const stroke = isSelected ? "#2563eb" : "#64748b";

  const common = {
    ref: shapeRef as React.RefObject<Konva.Rect>,
    x: 0,
    y: 0,
    fill,
    stroke,
    strokeWidth: isSelected ? 2 : 1,
    draggable: false,
  };

  return (
    <Group
      x={table.x}
      y={table.y}
      rotation={table.rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
      }}
    >
      {table.shape === "CIRCLE" ? (
        <Circle
          x={table.width / 2}
          y={table.height / 2}
          radius={Math.min(table.width, table.height) / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={isSelected ? 2 : 1}
        />
      ) : (
        <Rect
          width={table.width}
          height={table.height}
          fill={fill}
          stroke={stroke}
          strokeWidth={isSelected ? 2 : 1}
          cornerRadius={table.shape === "SQUARE" ? 4 : 6}
        />
      )}
      <Text
        text={`${table.label}\n${table.capacity}p`}
        width={table.width}
        height={table.height}
        align="center"
        verticalAlign="middle"
        fontSize={11}
        fill="#1e293b"
        fontStyle="bold"
        listening={false}
      />
      {table.isWindowSeat && (
        <Text
          text="🪟"
          x={table.width - 16}
          y={2}
          fontSize={12}
          listening={false}
        />
      )}
    </Group>
  );
}

function WallLine({ wall, onRemove, tool }: { wall: Wall; onRemove: () => void; tool: string }) {
  return (
    <Line
      points={[wall.x1, wall.y1, wall.x2, wall.y2]}
      stroke="#475569"
      strokeWidth={6}
      lineCap="round"
      onClick={() => tool === "erase" && onRemove()}
    />
  );
}

export default function FloorCanvas({ width, height, bgColor }: Props) {
  const { tables, walls, selectedId, tool, setSelectedId, updateTable, removeTable, addTable, addWall, removeWall } =
    useCanvasStore();

  const stageRef = useRef<Konva.Stage>(null);
  const wallStart = useRef<{ x: number; y: number } | null>(null);
  const uid = useId();

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage() || e.target.name() === "bg") {
        setSelectedId(null);

        if (tool === "table") {
          const pos = e.target.getStage()!.getPointerPosition()!;
          const id = `${uid}-${Date.now()}`;
          addTable({
            id,
            label: `T${tables.length + 1}`,
            shape: "RECTANGLE",
            x: pos.x - 40,
            y: pos.y - 40,
            width: 80,
            height: 80,
            rotation: 0,
            capacity: 4,
            minCapacity: 1,
            isWindowSeat: false,
            isActive: true,
            notes: "",
            floorId: "",
          });
        }
      }
    },
    [tool, tables.length, uid, addTable, setSelectedId]
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (tool !== "wall") return;
      const pos = stageRef.current!.getPointerPosition()!;
      wallStart.current = { x: pos.x, y: pos.y };
    },
    [tool]
  );

  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (tool !== "wall" || !wallStart.current) return;
      const pos = stageRef.current!.getPointerPosition()!;
      const id = `wall-${uid}-${Date.now()}`;
      addWall({ id, x1: wallStart.current.x, y1: wallStart.current.y, x2: pos.x, y2: pos.y, floorId: "" });
      wallStart.current = null;
    },
    [tool, uid, addWall]
  );

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      onClick={handleStageClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{ cursor: tool === "table" ? "crosshair" : tool === "wall" ? "crosshair" : "default" }}
    >
      <Layer>
        <Rect name="bg" x={0} y={0} width={width} height={height} fill={bgColor} />

        {walls.map((w) => (
          <WallLine key={w.id} wall={w} tool={tool} onRemove={() => removeWall(w.id)} />
        ))}

        {tables.map((t) => (
          <TableNode
            key={t.id}
            table={t}
            isSelected={selectedId === t.id}
            onSelect={() => {
              if (tool === "erase") {
                removeTable(t.id);
              } else {
                setSelectedId(t.id);
              }
            }}
            onChange={(patch) => updateTable(t.id, patch)}
          />
        ))}
      </Layer>
    </Stage>
  );
}
