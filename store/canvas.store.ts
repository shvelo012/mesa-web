import { create } from "zustand";
import { TableItem, Wall } from "../types";

export type ToolMode = "select" | "table" | "wall" | "erase";

interface CanvasState {
  tables: TableItem[];
  walls: Wall[];
  selectedId: string | null;
  tool: ToolMode;
  isDirty: boolean;

  setTables: (tables: TableItem[]) => void;
  setWalls: (walls: Wall[]) => void;
  addTable: (table: TableItem) => void;
  updateTable: (id: string, patch: Partial<TableItem>) => void;
  removeTable: (id: string) => void;
  addWall: (wall: Wall) => void;
  removeWall: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  setTool: (tool: ToolMode) => void;
  markDirty: () => void;
  markClean: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  tables: [],
  walls: [],
  selectedId: null,
  tool: "select",
  isDirty: false,

  setTables: (tables) => set({ tables }),
  setWalls: (walls) => set({ walls }),
  addTable: (table) => set((s) => ({ tables: [...s.tables, table], isDirty: true })),
  updateTable: (id, patch) =>
    set((s) => ({
      tables: s.tables.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      isDirty: true,
    })),
  removeTable: (id) =>
    set((s) => ({ tables: s.tables.filter((t) => t.id !== id), isDirty: true })),
  addWall: (wall) => set((s) => ({ walls: [...s.walls, wall], isDirty: true })),
  removeWall: (id) =>
    set((s) => ({ walls: s.walls.filter((w) => w.id !== id), isDirty: true })),
  setSelectedId: (id) => set({ selectedId: id }),
  setTool: (tool) => set({ tool, selectedId: null }),
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
}));
