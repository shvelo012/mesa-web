import { create } from "zustand";
import { TableItem, Wall } from "../types";

export type ToolMode = "select" | "table" | "wall" | "erase";

interface Snapshot {
  tables: TableItem[];
  walls: Wall[];
}

interface CanvasState {
  tables: TableItem[];
  walls: Wall[];
  selectedId: string | null;
  tool: ToolMode;
  isDirty: boolean;
  past: Snapshot[];
  future: Snapshot[];

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
  undo: () => void;
  redo: () => void;
}

const snap = (s: CanvasState): Snapshot => ({ tables: s.tables, walls: s.walls });
const pushPast = (past: Snapshot[], current: Snapshot): Snapshot[] => [...past.slice(-19), current];

export const useCanvasStore = create<CanvasState>((set) => ({
  tables: [],
  walls: [],
  selectedId: null,
  tool: "select",
  isDirty: false,
  past: [],
  future: [],

  setTables: (tables) => set({ tables, past: [], future: [] }),
  setWalls: (walls) => set({ walls, past: [], future: [] }),

  addTable: (table) =>
    set((s) => ({ past: pushPast(s.past, snap(s)), future: [], tables: [...s.tables, table], isDirty: true })),

  updateTable: (id, patch) =>
    set((s) => ({
      past: pushPast(s.past, snap(s)),
      future: [],
      tables: s.tables.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      isDirty: true,
    })),

  removeTable: (id) =>
    set((s) => ({
      past: pushPast(s.past, snap(s)),
      future: [],
      tables: s.tables.filter((t) => t.id !== id),
      isDirty: true,
    })),

  addWall: (wall) =>
    set((s) => ({ past: pushPast(s.past, snap(s)), future: [], walls: [...s.walls, wall], isDirty: true })),

  removeWall: (id) =>
    set((s) => ({
      past: pushPast(s.past, snap(s)),
      future: [],
      walls: s.walls.filter((w) => w.id !== id),
      isDirty: true,
    })),

  setSelectedId: (id) => set({ selectedId: id }),
  setTool: (tool) => set({ tool, selectedId: null }),
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),

  undo: () =>
    set((s) => {
      if (!s.past.length) return s;
      const prev = s.past[s.past.length - 1];
      return {
        past: s.past.slice(0, -1),
        future: [snap(s), ...s.future.slice(0, 19)],
        tables: prev.tables,
        walls: prev.walls,
        isDirty: true,
      };
    }),

  redo: () =>
    set((s) => {
      if (!s.future.length) return s;
      const next = s.future[0];
      return {
        past: pushPast(s.past, snap(s)),
        future: s.future.slice(1),
        tables: next.tables,
        walls: next.walls,
        isDirty: true,
      };
    }),
}));
