"use client";

import { useRef, useState } from "react";
import { Menu, MenuPhoto } from "@/types";
import { api } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:4000";

interface Props {
  menu: Menu;
  onUpdate: (menu: Menu) => void;
}

export default function PhotoMenuEditor({ menu, onUpdate }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function photoUrl(url: string) {
    if (url.startsWith("http")) return url;
    return `${API_BASE}${url}`;
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("photos", f));
    setUploading(true);
    setError("");
    try {
      const { data } = await api.post(`/menus/${menu.id}/photos`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUpdate({ ...menu, photos: [...(menu.photos ?? []), ...data] });
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(photo: MenuPhoto) {
    try {
      await api.delete(`/menus/${menu.id}/photos/${photo.id}`);
      onUpdate({ ...menu, photos: (menu.photos ?? []).filter((p) => p.id !== photo.id) });
    } catch {
      setError("Delete failed");
    }
  }

  const photos = menu.photos ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {error && (
        <div style={{ padding: "0.625rem 0.875rem", background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem" }}>{error}</div>
      )}

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        style={{
          border: "2px dashed rgba(24,22,15,0.16)",
          borderRadius: "10px",
          padding: "2rem",
          textAlign: "center",
          cursor: "pointer",
          background: uploading ? "#f0ede8" : "#fafaf8",
          transition: "background 0.15s",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</div>
        <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#18160f", marginBottom: "0.25rem" }}>
          {uploading ? "Uploading…" : "Drop menu photos here"}
        </div>
        <div style={{ fontSize: "0.8125rem", color: "#9a9088" }}>or click to browse · max 10MB per file</div>
        <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
          {photos.sort((a, b) => a.order - b.order).map((photo) => (
            <div key={photo.id} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(24,22,15,0.09)", background: "#f0ede8", aspectRatio: "4/3" }}>
              <img
                src={photoUrl(photo.url)}
                alt="Menu"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                onClick={() => handleDelete(photo)}
                style={{
                  position: "absolute", top: "0.375rem", right: "0.375rem",
                  background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%",
                  width: "26px", height: "26px", color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.875rem", fontFamily: "inherit",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && !uploading && (
        <div style={{ textAlign: "center", color: "#9a9088", fontSize: "0.875rem", paddingBottom: "0.5rem" }}>No photos yet</div>
      )}
    </div>
  );
}
