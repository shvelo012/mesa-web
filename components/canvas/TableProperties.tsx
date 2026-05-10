"use client";

import { useCanvasStore } from "@/store/canvas.store";
import { TableShape } from "@/types";

export default function TableProperties() {
  const { tables, selectedId, updateTable, removeTable, setSelectedId } = useCanvasStore();
  const table = tables.find((t) => t.id === selectedId);

  if (!table) {
    return (
      <div className="p-4 text-sm text-slate-400 italic">
        Click a table to edit its properties.
      </div>
    );
  }

  const update = (patch: Parameters<typeof updateTable>[1]) => updateTable(table.id, patch);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Table Properties</h3>
        <button
          onClick={() => { removeTable(table.id); setSelectedId(null); }}
          className="text-red-500 text-xs hover:text-red-700"
        >
          Delete
        </button>
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1">Label</label>
        <input
          className="w-full border border-slate-200 rounded px-2 py-1 text-sm"
          value={table.label}
          onChange={(e) => update({ label: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1">Shape</label>
        <select
          className="w-full border border-slate-200 rounded px-2 py-1 text-sm"
          value={table.shape}
          onChange={(e) => update({ shape: e.target.value as TableShape })}
        >
          <option value="RECTANGLE">Rectangle</option>
          <option value="SQUARE">Square</option>
          <option value="CIRCLE">Circle</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Width</label>
          <input
            type="number"
            className="w-full border border-slate-200 rounded px-2 py-1 text-sm"
            value={table.width}
            onChange={(e) => update({ width: +e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Height</label>
          <input
            type="number"
            className="w-full border border-slate-200 rounded px-2 py-1 text-sm"
            value={table.height}
            onChange={(e) => update({ height: +e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Rotation (°)</label>
          <input
            type="number"
            className="w-full border border-slate-200 rounded px-2 py-1 text-sm"
            value={table.rotation}
            onChange={(e) => update({ rotation: +e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Capacity</label>
          <input
            type="number"
            min={1}
            className="w-full border border-slate-200 rounded px-2 py-1 text-sm"
            value={table.capacity}
            onChange={(e) => update({ capacity: +e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1">Min Party Size</label>
        <input
          type="number"
          min={1}
          className="w-full border border-slate-200 rounded px-2 py-1 text-sm"
          value={table.minCapacity}
          onChange={(e) => update({ minCapacity: +e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="windowSeat"
          checked={table.isWindowSeat}
          onChange={(e) => update({ isWindowSeat: e.target.checked })}
        />
        <label htmlFor="windowSeat" className="text-sm text-slate-700">
          Window seat
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={table.isActive}
          onChange={(e) => update({ isActive: e.target.checked })}
        />
        <label htmlFor="isActive" className="text-sm text-slate-700">
          Active (bookable)
        </label>
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1">Notes</label>
        <textarea
          className="w-full border border-slate-200 rounded px-2 py-1 text-sm"
          rows={2}
          value={table.notes || ""}
          onChange={(e) => update({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}
