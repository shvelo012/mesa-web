"use client";

import { useRef, useState, useEffect } from "react";
import { useCanvasStore } from "@/store/canvas.store";
import { TableShape } from "@/types";
import { useTranslation } from "react-i18next";

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

const sectionSt: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

export default function TableProperties() {
  const { t } = useTranslation();
  const { tables, selectedId, updateTable, removeTable, duplicateTable, setSelectedId } = useCanvasStore();
  const table = tables.find((t) => t.id === selectedId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [raw, setRaw] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!table) return;
    setRaw({
      diameter: String(Math.max(table.width, table.height)),
      width: String(table.width),
      height: String(table.height),
      rotation: String(table.rotation),
      capacity: String(table.capacity),
      minCapacity: String(table.minCapacity),
    });
  }, [table?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!table) {
    return (
      <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem", opacity: 0.3 }}>⬡</div>
        <p style={{ fontSize: "0.8125rem", color: "#9a9088", lineHeight: 1.5 }}>
          {t("tableProperties.noSelection")}
        </p>
        <p style={{ fontSize: "0.75rem", color: "#c8c4be", marginTop: "0.5rem", lineHeight: 1.4 }}>
          {t("tableProperties.deleteHint")}
        </p>
      </div>
    );
  }

  const update = (patch: Parameters<typeof updateTable>[1]) => updateTable(table.id, patch);
  const isCircle = table.shape === "CIRCLE";
  const capacityWarning = table.minCapacity > table.capacity;
  const diameter = Math.max(table.width, table.height);

  return (
    <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#18160f" }}>
          {t("tableProperties.title", { label: table.label })}
        </span>
        <div style={{ display: "flex", gap: "0.375rem" }}>
          <button
            onClick={() => { duplicateTable(table.id); }}
            title="Duplicate table"
            style={{ fontSize: "0.75rem", fontWeight: 600, background: "#f0ede8", border: "none", borderRadius: "4px", color: "#5c5248", cursor: "pointer", padding: "0.25rem 0.5rem", fontFamily: "inherit" }}
          >
            {t("tableProperties.copy")}
          </button>
          <button
            onClick={() => { removeTable(table.id); setSelectedId(null); }}
            title="Delete table (Del)"
            style={{ fontSize: "0.75rem", fontWeight: 600, background: "#fef2f2", border: "none", borderRadius: "4px", color: "#dc2626", cursor: "pointer", padding: "0.25rem 0.5rem", fontFamily: "inherit" }}
          >
            {t("tableProperties.delete")}
          </button>
        </div>
      </div>

      <div style={{ height: "1px", background: "rgba(24,22,15,0.07)" }} />

      {/* Identity */}
      <div style={sectionSt}>
        <div>
          <label style={labelSt}>{t("tableProperties.label")}</label>
          <input style={inputSt} value={table.label} onChange={(e) => update({ label: e.target.value })} />
        </div>

        <div>
          <label style={labelSt}>{t("tableProperties.shape")}</label>
          <select style={inputSt} value={table.shape} onChange={(e) => {
            const shape = e.target.value as TableShape;
            if (shape === "CIRCLE") {
              const d = Math.max(table.width, table.height);
              update({ shape, width: d, height: d });
            } else if (shape === "SQUARE") {
              const s = Math.max(table.width, table.height);
              update({ shape, width: s, height: s });
            } else {
              update({ shape });
            }
          }}>
            <option value="RECTANGLE">{t("tableProperties.shapes.RECTANGLE")}</option>
            <option value="SQUARE">{t("tableProperties.shapes.SQUARE")}</option>
            <option value="CIRCLE">{t("tableProperties.shapes.CIRCLE")}</option>
          </select>
        </div>
      </div>

      <div style={{ height: "1px", background: "rgba(24,22,15,0.07)" }} />

      {/* Dimensions */}
      <div style={sectionSt}>
        {isCircle ? (
          <div>
            <label style={labelSt}>{t("tableProperties.diameter")}</label>
            <input
              type="text"
              inputMode="numeric"
              style={inputSt}
              value={raw.diameter ?? String(diameter)}
              onChange={(e) => setRaw((r) => ({ ...r, diameter: e.target.value }))}
              onBlur={() => {
                const v = parseInt(raw.diameter ?? "", 10);
                const c = isNaN(v) ? diameter : Math.max(40, v);
                update({ width: c, height: c });
                setRaw((r) => ({ ...r, diameter: String(c) }));
              }}
            />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <div>
              <label style={labelSt}>{t("tableProperties.width")}</label>
              <input
                type="text"
                inputMode="numeric"
                style={inputSt}
                value={raw.width ?? String(table.width)}
                onChange={(e) => setRaw((r) => ({ ...r, width: e.target.value }))}
                onBlur={() => {
                  const v = parseInt(raw.width ?? "", 10);
                  const c = isNaN(v) ? table.width : Math.max(40, v);
                  update({ width: c });
                  setRaw((r) => ({ ...r, width: String(c) }));
                }}
              />
            </div>
            <div>
              <label style={labelSt}>{t("tableProperties.height")}</label>
              <input
                type="text"
                inputMode="numeric"
                style={inputSt}
                value={raw.height ?? String(table.height)}
                onChange={(e) => setRaw((r) => ({ ...r, height: e.target.value }))}
                onBlur={() => {
                  const v = parseInt(raw.height ?? "", 10);
                  const c = isNaN(v) ? table.height : Math.max(40, v);
                  update({ height: c });
                  setRaw((r) => ({ ...r, height: String(c) }));
                }}
              />
            </div>
          </div>
        )}

        <div>
          <label style={{ ...labelSt, marginBottom: "0.5rem" }}>
            {t("tableProperties.rotation", { deg: table.rotation })}
          </label>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={table.rotation}
              onChange={(e) => update({ rotation: +e.target.value })}
              style={{ flex: 1, accentColor: "#c4410c" }}
            />
            <input
              type="text"
              inputMode="numeric"
              style={{ ...inputSt, width: "56px" }}
              value={raw.rotation ?? String(table.rotation)}
              onChange={(e) => {
                setRaw((r) => ({ ...r, rotation: e.target.value }));
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && e.target.value !== "") update({ rotation: Math.min(360, Math.max(0, v)) });
              }}
              onBlur={() => {
                const v = parseInt(raw.rotation ?? "", 10);
                const c = isNaN(v) ? table.rotation : Math.min(360, Math.max(0, v));
                update({ rotation: c });
                setRaw((r) => ({ ...r, rotation: String(c) }));
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ height: "1px", background: "rgba(24,22,15,0.07)" }} />

      {/* Capacity */}
      <div style={sectionSt}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <div>
            <label style={labelSt}>{t("tableProperties.capacity")}</label>
            <input
              type="text"
              inputMode="numeric"
              style={{ ...inputSt, borderColor: capacityWarning ? "#dc2626" : undefined }}
              value={raw.capacity ?? String(table.capacity)}
              onChange={(e) => setRaw((r) => ({ ...r, capacity: e.target.value }))}
              onBlur={() => {
                const v = parseInt(raw.capacity ?? "", 10);
                const c = isNaN(v) ? table.capacity : Math.max(1, v);
                update({ capacity: c });
                setRaw((r) => ({ ...r, capacity: String(c) }));
              }}
            />
          </div>
          <div>
            <label style={labelSt}>{t("tableProperties.minParty")}</label>
            <input
              type="text"
              inputMode="numeric"
              style={{ ...inputSt, borderColor: capacityWarning ? "#dc2626" : undefined }}
              value={raw.minCapacity ?? String(table.minCapacity)}
              onChange={(e) => setRaw((r) => ({ ...r, minCapacity: e.target.value }))}
              onBlur={() => {
                const v = parseInt(raw.minCapacity ?? "", 10);
                const c = isNaN(v) ? table.minCapacity : Math.max(1, v);
                update({ minCapacity: c });
                setRaw((r) => ({ ...r, minCapacity: String(c) }));
              }}
            />
          </div>
        </div>
        {capacityWarning && (
          <p style={{ fontSize: "0.75rem", color: "#dc2626", marginTop: "-0.25rem" }}>
            {t("tableProperties.capacityWarning")}
          </p>
        )}
      </div>

      <div style={{ height: "1px", background: "rgba(24,22,15,0.07)" }} />

      {/* Flags */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {[
          { id: "windowSeat", checked: table.isWindowSeat, label: t("tableProperties.windowSeat"), onChange: (v: boolean) => update({ isWindowSeat: v }) },
          { id: "isActive", checked: table.isActive, label: t("tableProperties.active"), onChange: (v: boolean) => update({ isActive: v }) },
        ].map(({ id, checked, label, onChange }) => (
          <label key={id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              id={id}
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              style={{ accentColor: "#c4410c", width: "14px", height: "14px" }}
            />
            <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#5c5248" }}>{label}</span>
          </label>
        ))}
      </div>

      <div style={{ height: "1px", background: "rgba(24,22,15,0.07)" }} />

      {/* Notes */}
      <div>
        <label style={labelSt}>{t("tableProperties.notes")}</label>
        <textarea
          style={{ ...inputSt, resize: "none" }}
          rows={2}
          value={table.notes || ""}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder={t("tableProperties.notesPlaceholder")}
        />
      </div>

      <div style={{ height: "1px", background: "rgba(24,22,15,0.07)" }} />

      {/* Photo */}
      <div>
        <label style={labelSt}>{t("tableProperties.photo")}</label>
        {table.imageUrl ? (
          <div style={{ position: "relative", borderRadius: "6px", overflow: "hidden", border: "1px solid rgba(24,22,15,0.14)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={table.imageUrl} alt={table.label} style={{ display: "block", width: "100%", height: "120px", objectFit: "cover" }} />
            <button
              onClick={() => update({ imageUrl: null })}
              style={{ position: "absolute", top: 6, right: 6, background: "rgba(24,22,15,0.75)", color: "#fff", border: "none", borderRadius: 4, fontSize: "0.7rem", padding: "0.2rem 0.45rem", cursor: "pointer", fontFamily: "inherit" }}
            >
              {t("tableProperties.removePhoto")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            style={{ width: "100%", padding: "0.75rem", background: "#fafaf8", border: "1px dashed rgba(24,22,15,0.2)", borderRadius: "6px", cursor: "pointer", fontSize: "0.8125rem", color: "#5c5248", fontFamily: "inherit" }}
          >
            {t("tableProperties.uploadPhoto")}
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
          {t("tableProperties.photoNote")}
        </p>
      </div>
    </div>
  );
}
