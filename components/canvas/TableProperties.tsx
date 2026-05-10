"use client";

import { useRef } from "react";
import { useCanvasStore } from "@/store/canvas.store";
import { TableShape } from "@/types";

async function fileToCompressedDataUrl(file: File, maxDim = 720, quality = 0.78): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("image load failed"));
    i.src = dataUrl;
  });
  const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

const inputSt: React.CSSProperties = {
  width: "100%",
  background: "#ffffff",
  border: "1px solid rgba(24,22,15,0.14)",
  borderRadius: "6px",
  color: "#18160f",
  padding: "0.4rem 0.625rem",
  fontSize: "0.8125rem",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontWeight: 400,
  outline: "none",
};

const labelSt: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "#9a9088",
  marginBottom: "0.3rem",
};

export default function TableProperties() {
  const { tables, selectedId, updateTable, removeTable, setSelectedId } = useCanvasStore();
  const table = tables.find((t) => t.id === selectedId);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!table) {
    return (
      <div style={{ padding: "1.5rem 1rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.8125rem", color: "#9a9088", lineHeight: 1.5 }}>
          Click a table on the canvas to edit its properties.
        </p>
      </div>
    );
  }

  const update = (patch: Parameters<typeof updateTable>[1]) => updateTable(table.id, patch);

  return (
    <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#18160f" }}>Table {table.label}</span>
        <button
          onClick={() => { removeTable(table.id); setSelectedId(null); }}
          style={{ fontSize: "0.75rem", fontWeight: 600, background: "#fef2f2", border: "none", borderRadius: "4px", color: "#dc2626", cursor: "pointer", padding: "0.25rem 0.5rem", fontFamily: "inherit" }}
        >
          Delete
        </button>
      </div>

      <div style={{ height: "1px", background: "rgba(24,22,15,0.07)" }} />

      <div>
        <label style={labelSt}>Label</label>
        <input style={inputSt} value={table.label} onChange={(e) => update({ label: e.target.value })} />
      </div>

      <div>
        <label style={labelSt}>Shape</label>
        <select style={inputSt} value={table.shape} onChange={(e) => update({ shape: e.target.value as TableShape })}>
          <option value="RECTANGLE">Rectangle</option>
          <option value="SQUARE">Square</option>
          <option value="CIRCLE">Circle</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        <div>
          <label style={labelSt}>Width</label>
          <input type="number" style={inputSt} value={table.width} onChange={(e) => update({ width: +e.target.value })} />
        </div>
        <div>
          <label style={labelSt}>Height</label>
          <input type="number" style={inputSt} value={table.height} onChange={(e) => update({ height: +e.target.value })} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        <div>
          <label style={labelSt}>Rotation °</label>
          <input type="number" style={inputSt} value={table.rotation} onChange={(e) => update({ rotation: +e.target.value })} />
        </div>
        <div>
          <label style={labelSt}>Capacity</label>
          <input type="number" min={1} style={inputSt} value={table.capacity} onChange={(e) => update({ capacity: +e.target.value })} />
        </div>
      </div>

      <div>
        <label style={labelSt}>Min Party Size</label>
        <input type="number" min={1} style={inputSt} value={table.minCapacity} onChange={(e) => update({ minCapacity: +e.target.value })} />
      </div>

      <div style={{ height: "1px", background: "rgba(24,22,15,0.07)" }} />

      {[
        { id: "windowSeat", checked: table.isWindowSeat, label: "Window seat", onChange: (v: boolean) => update({ isWindowSeat: v }) },
        { id: "isActive", checked: table.isActive, label: "Active (bookable)", onChange: (v: boolean) => update({ isActive: v }) },
      ].map(({ id, checked, label, onChange }) => (
        <label key={id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
          <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: "#c4410c", width: "14px", height: "14px" }} />
          <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#5c5248" }}>{label}</span>
        </label>
      ))}

      <div>
        <label style={labelSt}>Notes</label>
        <textarea style={{ ...inputSt, resize: "none" }} rows={2} value={table.notes || ""} onChange={(e) => update({ notes: e.target.value })} placeholder="e.g. near window, accessible" />
      </div>

      <div style={{ height: "1px", background: "rgba(24,22,15,0.07)" }} />

      <div>
        <label style={labelSt}>Photo</label>
        {table.imageUrl ? (
          <div style={{ position: "relative", borderRadius: "6px", overflow: "hidden", border: "1px solid rgba(24,22,15,0.14)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={table.imageUrl} alt={table.label} style={{ display: "block", width: "100%", height: "120px", objectFit: "cover" }} />
            <button
              onClick={() => update({ imageUrl: null })}
              style={{ position: "absolute", top: 6, right: 6, background: "rgba(24,22,15,0.75)", color: "#fff", border: "none", borderRadius: 4, fontSize: "0.7rem", padding: "0.2rem 0.45rem", cursor: "pointer", fontFamily: "inherit" }}
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            style={{ width: "100%", padding: "0.75rem", background: "#fafaf8", border: "1px dashed rgba(24,22,15,0.2)", borderRadius: "6px", cursor: "pointer", fontSize: "0.8125rem", color: "#5c5248", fontFamily: "inherit" }}
          >
            + Upload photo
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const dataUrl = await fileToCompressedDataUrl(file);
              update({ imageUrl: dataUrl });
            } catch (err) {
              console.error(err);
            } finally {
              e.target.value = "";
            }
          }}
        />
        <p style={{ fontSize: "0.7rem", color: "#9a9088", marginTop: "0.35rem" }}>
          Shown to guests when they tap this table.
        </p>
      </div>
    </div>
  );
}
