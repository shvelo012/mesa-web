"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { Stage, Layer, Rect, Line, Group, Transformer } from "react-konva";
import Konva from "konva";
import { useCanvasStore } from "@/store/canvas.store";
import { TableItem, Wall } from "@/types";
import TableShape, { CHAIR_PAD, checkCollision } from "./TableShape";

const GRID = 10;

interface Props {
  width: number;
  height: number;
  bgColor: string;
  scale?: number;
}

function TableNode({
  table,
  isSelected,
  hasCollision,
  onSelect,
  onChange,
  stageWidth,
  stageHeight,
}: {
  table: TableItem;
  isSelected: boolean;
  hasCollision: boolean;
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

  const fill = !table.isActive
    ? "#e5e2dd"
    : table.isWindowSeat
    ? "#bfdbfe"
    : table.shape === "CIRCLE"
    ? "#fde68a"
    : "#bbf7d0";

  const stroke = isSelected ? "#2563eb" : hasCollision ? "#dc2626" : "#64748b";
  const snap = (v: number) => Math.round(v / GRID) * GRID;

  const minX = CHAIR_PAD;
  const minY = CHAIR_PAD;
  const maxX = stageWidth - table.width - CHAIR_PAD;
  const maxY = stageHeight - table.height - CHAIR_PAD;

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
          x: Math.max(minX, Math.min(maxX, pos.x)),
          y: Math.max(minY, Math.min(maxY, pos.y)),
        })}
        onDragEnd={(e) => {
          const x = Math.max(minX, Math.min(maxX, snap(e.target.x())));
          const y = Math.max(minY, Math.min(maxY, snap(e.target.y())));
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
          const x = Math.max(CHAIR_PAD, Math.min(stageWidth - newW - CHAIR_PAD, snap(node.x())));
          const y = Math.max(CHAIR_PAD, Math.min(stageHeight - newH - CHAIR_PAD, snap(node.y())));
          node.position({ x, y });
          onChange({ x, y, width: newW, height: newH, rotation: node.rotation() });
        }}
      >
        <TableShape
          table={table}
          fill={fill}
          stroke={stroke}
          strokeWidth={isSelected ? 2 : 1}
          showWarning={hasCollision && !isSelected}
        />
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

const GHOST_W = 80;
const GHOST_H = 80;
const GHOST_TABLE: TableItem = {
  id: "__ghost__",
  label: "T?",
  shape: "RECTANGLE",
  x: 0,
  y: 0,
  width: GHOST_W,
  height: GHOST_H,
  rotation: 0,
  capacity: 4,
  minCapacity: 1,
  isWindowSeat: false,
  isActive: true,
  notes: "",
  floorId: "",
};

export default function FloorCanvas({ width, height, bgColor, scale = 1 }: Props) {
  const {
    tables, walls, selectedId, tool,
    setSelectedId, updateTable, removeTable, addTable, addWall, removeWall, undo, redo, setTool,
  } = useCanvasStore();

  const stageRef = useRef<Konva.Stage>(null);
  const wallStart = useRef<{ x: number; y: number } | null>(null);
  const newId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const [previewLine, setPreviewLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

  const snap = (v: number) => Math.round(v / GRID) * GRID;

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
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === "s") { e.preventDefault(); setTool("select"); }
        if (e.key === "t") { e.preventDefault(); setTool("table"); }
        if (e.key === "w") { e.preventDefault(); setTool("wall"); }
        if (e.key === "e") { e.preventDefault(); setTool("erase"); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, removeTable, setSelectedId, undo, redo, setTool]);

  useEffect(() => {
    if (tool !== "table") setGhostPos(null);
    if (tool !== "wall") {
      wallStart.current = null;
      setPreviewLine(null);
    }
  }, [tool]);

  const clampGhost = (pos: { x: number; y: number }) => ({
    x: Math.max(CHAIR_PAD, Math.min(width - GHOST_W - CHAIR_PAD, snap(pos.x - GHOST_W / 2))),
    y: Math.max(CHAIR_PAD, Math.min(height - GHOST_H - CHAIR_PAD, snap(pos.y - GHOST_H / 2))),
  });

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage() || e.target.name() === "bg") {
        setSelectedId(null);
        if (tool === "table") {
          const pos = e.target.getStage()!.getPointerPosition()!;
          const { x, y } = clampGhost(pos);
          const maxNum = tables.reduce((m, t) => {
            const n = parseInt(t.label.replace(/\D/g, ""), 10);
            return isNaN(n) ? m : Math.max(m, n);
          }, 0);
          addTable({
            id: newId(),
            label: `T${maxNum + 1}`,
            shape: "RECTANGLE",
            x,
            y,
            width: GHOST_W,
            height: GHOST_H,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tool, tables, addTable, setSelectedId, width, height]
  );

  const handleMouseDown = useCallback(
    () => {
      if (tool !== "wall") return;
      const pos = stageRef.current!.getPointerPosition()!;
      wallStart.current = { x: snap(pos.x), y: snap(pos.y) };
      setPreviewLine(null);
    },
    [tool]
  );

  const handleMouseMove = useCallback(
    () => {
      const pos = stageRef.current?.getPointerPosition();
      if (!pos) return;
      if (tool === "wall" && wallStart.current) {
        setPreviewLine({
          x1: wallStart.current.x,
          y1: wallStart.current.y,
          x2: snap(pos.x),
          y2: snap(pos.y),
        });
      } else if (tool === "table") {
        setGhostPos(clampGhost(pos));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tool, width, height]
  );

  const handleMouseUp = useCallback(
    () => {
      if (tool !== "wall" || !wallStart.current) return;
      const pos = stageRef.current!.getPointerPosition()!;
      const x2 = snap(pos.x);
      const y2 = snap(pos.y);
      const dist = Math.hypot(x2 - wallStart.current.x, y2 - wallStart.current.y);
      if (dist >= 10) {
        addWall({
          id: newId(),
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
    [tool, addWall]
  );

  const handleMouseLeave = useCallback(() => {
    setGhostPos(null);
    if (wallStart.current) {
      wallStart.current = null;
      setPreviewLine(null);
    }
  }, []);

  const cursor =
    tool === "table" ? "crosshair" :
    tool === "wall" ? "crosshair" :
    tool === "erase" ? "cell" :
    "default";

  const ghostTable: TableItem | null = ghostPos
    ? { ...GHOST_TABLE, x: ghostPos.x, y: ghostPos.y }
    : null;

  const ghostCollision = ghostTable ? checkCollision(ghostTable, tables) : false;

  return (
    <Stage
      ref={stageRef}
      width={width * scale}
      height={height * scale}
      scaleX={scale}
      scaleY={scale}
      onClick={handleStageClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
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
            hasCollision={checkCollision(t, tables)}
            stageWidth={width}
            stageHeight={height}
            onSelect={() => {
              if (tool === "erase") removeTable(t.id);
              else setSelectedId(t.id);
            }}
            onChange={(patch) => updateTable(t.id, patch)}
          />
        ))}

        {ghostTable && (
          <Group x={ghostTable.x} y={ghostTable.y} listening={false}>
            <TableShape
              table={ghostTable}
              fill={ghostCollision ? "#fee2e2" : "#bbf7d0"}
              stroke={ghostCollision ? "#dc2626" : "#16a34a"}
              strokeWidth={1.5}
              opacity={0.55}
              showLabel={false}
            />
          </Group>
        )}
      </Layer>
    </Stage>
  );
}
