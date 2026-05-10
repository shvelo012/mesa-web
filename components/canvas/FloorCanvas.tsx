"use client";

import { useRef, useCallback, useId, useEffect, useState } from "react";
import { Stage, Layer, Rect, Circle, Line, Group, Text, Transformer } from "react-konva";
import Konva from "konva";
import { useCanvasStore } from "@/store/canvas.store";
import { TableItem, Wall } from "@/types";
import { TableShape } from "@/types";

const GRID = 10;

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
  stageWidth,
  stageHeight,
}: {
  table: TableItem;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<TableItem>) => void;
  stageWidth: number;
  stageHeight: number;
}) {
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const fill = table.isWindowSeat ? "#bfdbfe" : table.shape === "CIRCLE" ? "#fde68a" : "#bbf7d0";
  const stroke = isSelected ? "#2563eb" : "#64748b";
  const snap = (v: number) => Math.round(v / GRID) * GRID;

  return (
    <>
      <Group
        ref={groupRef}
        x={table.x}
        y={table.y}
        rotation={table.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        dragBoundFunc={(pos) => ({
          x: Math.max(0, Math.min(stageWidth - table.width, pos.x)),
          y: Math.max(0, Math.min(stageHeight - table.height, pos.y)),
        })}
        onDragEnd={(e) => {
          const x = Math.max(0, Math.min(stageWidth - table.width, snap(e.target.x())));
          const y = Math.max(0, Math.min(stageHeight - table.height, snap(e.target.y())));
          e.target.position({ x, y });
          onChange({ x, y });
        }}
        onTransformEnd={() => {
          const node = groupRef.current!;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          const newW = Math.max(40, snap(table.width * scaleX));
          const newH = Math.max(40, snap(table.height * scaleY));
          const x = Math.max(0, Math.min(stageWidth - newW, snap(node.x())));
          const y = Math.max(0, Math.min(stageHeight - newH, snap(node.y())));
          node.position({ x, y });
          onChange({ x, y, width: newW, height: newH, rotation: node.rotation() });
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
          <Text text="🪟" x={table.width - 16} y={2} fontSize={12} listening={false} />
        )}
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          keepRatio={table.shape === "CIRCLE"}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          rotationSnapTolerance={10}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 40 || newBox.height < 40 ? oldBox : newBox
          }
        />
      )}
    </>
  );
}

function WallLine({ wall, onRemove, tool }: { wall: Wall; onRemove: () => void; tool: string }) {
  return (
    <Line
      points={[wall.x1, wall.y1, wall.x2, wall.y2]}
      stroke="#475569"
      strokeWidth={6}
      lineCap="round"
      hitStrokeWidth={20}
      onClick={() => tool === "erase" && onRemove()}
    />
  );
}

export default function FloorCanvas({ width, height, bgColor }: Props) {
  const {
    tables, walls, selectedId, tool,
    setSelectedId, updateTable, removeTable, addTable, addWall, removeWall, undo, redo,
  } = useCanvasStore();

  const stageRef = useRef<Konva.Stage>(null);
  const wallStart = useRef<{ x: number; y: number } | null>(null);
  const uid = useId();
  const [previewLine, setPreviewLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  const snap = (v: number) => Math.round(v / GRID) * GRID;

  // Keyboard shortcuts: Delete, Escape, Ctrl+Z, Ctrl+Y
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        removeTable(selectedId);
        setSelectedId(null);
      }
      if (e.key === "Escape") setSelectedId(null);
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, removeTable, setSelectedId, undo, redo]);

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage() || e.target.name() === "bg") {
        setSelectedId(null);
        if (tool === "table") {
          const pos = e.target.getStage()!.getPointerPosition()!;
          const x = Math.max(0, Math.min(width - 80, snap(pos.x - 40)));
          const y = Math.max(0, Math.min(height - 80, snap(pos.y - 40)));
          const maxNum = tables.reduce((m, t) => {
            const n = parseInt(t.label.replace(/\D/g, ""), 10);
            return isNaN(n) ? m : Math.max(m, n);
          }, 0);
          addTable({
            id: `${uid}-${Date.now()}`,
            label: `T${maxNum + 1}`,
            shape: "RECTANGLE",
            x, y,
            width: 80, height: 80, rotation: 0, capacity: 4, minCapacity: 1,
            isWindowSeat: false, isActive: true, notes: "", floorId: "",
          });
        }
      }
    },
    [tool, tables, uid, addTable, setSelectedId, width, height]
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (tool !== "wall") return;
      const pos = stageRef.current!.getPointerPosition()!;
      wallStart.current = { x: snap(pos.x), y: snap(pos.y) };
      setPreviewLine(null);
    },
    [tool]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (tool !== "wall" || !wallStart.current) return;
      const pos = stageRef.current!.getPointerPosition()!;
      setPreviewLine({
        x1: wallStart.current.x,
        y1: wallStart.current.y,
        x2: snap(pos.x),
        y2: snap(pos.y),
      });
    },
    [tool]
  );

  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (tool !== "wall" || !wallStart.current) return;
      const pos = stageRef.current!.getPointerPosition()!;
      const x2 = snap(pos.x);
      const y2 = snap(pos.y);
      const dist = Math.hypot(x2 - wallStart.current.x, y2 - wallStart.current.y);
      if (dist >= 10) {
        addWall({
          id: `wall-${uid}-${Date.now()}`,
          x1: wallStart.current.x,
          y1: wallStart.current.y,
          x2,
          y2,
          floorId: "",
        });
      }
      wallStart.current = null;
      setPreviewLine(null);
    },
    [tool, uid, addWall]
  );

  const cursor =
    tool === "table" ? "crosshair" :
    tool === "wall" ? "crosshair" :
    tool === "erase" ? "cell" :
    "default";

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      onClick={handleStageClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ cursor }}
    >
      <Layer>
        <Rect name="bg" x={0} y={0} width={width} height={height} fill={bgColor} />

        {walls.map((w) => (
          <WallLine key={w.id} wall={w} tool={tool} onRemove={() => removeWall(w.id)} />
        ))}

        {previewLine && (
          <Line
            points={[previewLine.x1, previewLine.y1, previewLine.x2, previewLine.y2]}
            stroke="#475569"
            strokeWidth={4}
            lineCap="round"
            dash={[8, 6]}
            opacity={0.6}
            listening={false}
          />
        )}

        {tables.map((t) => (
          <TableNode
            key={t.id}
            table={t}
            isSelected={selectedId === t.id}
            stageWidth={width}
            stageHeight={height}
            onSelect={() => {
              if (tool === "erase") removeTable(t.id);
              else setSelectedId(t.id);
            }}
            onChange={(patch) => updateTable(t.id, patch)}
          />
        ))}
      </Layer>
    </Stage>
  );
}
