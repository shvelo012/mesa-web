"use client";

import { useState } from "react";
import { Menu } from "@/types";
import { api } from "@/lib/api";
import { MENU_PRESETS, LAYOUT_OPTIONS, MenuPreset, LayoutOption } from "@/lib/menu-presets";

interface Props {
  onClose: () => void;
  onCreated: (menu: Menu) => void;
}

type Step = "type" | "photo-ready" | "structured-options";

export default function CreateMenuModal({ onClose, onCreated }: Props) {
  const [step, setStep] = useState<Step>("type");
  const [menuName, setMenuName] = useState("");
  const [menuType, setMenuType] = useState<"PHOTO" | "STRUCTURED" | "">("");
  const [selectedPreset, setSelectedPreset] = useState<MenuPreset>(MENU_PRESETS[0]);
  const [selectedLayout, setSelectedLayout] = useState<LayoutOption>(LAYOUT_OPTIONS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!menuName.trim() || !menuType) return;
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        name: menuName.trim(),
        type: menuType,
      };
      if (menuType === "STRUCTURED") {
        body.layoutStyle = selectedLayout.id;
        body.groups = selectedPreset.groups;
      }
      const { data } = await api.post("/menus", body);
      onCreated(data);
      onClose();
    } catch {
      setError("Failed to create menu");
    } finally {
      setSaving(false);
    }
  }

  function handleTypeNext(e: React.FormEvent) {
    e.preventDefault();
    if (!menuName.trim() || !menuType) return;
    if (menuType === "PHOTO") {
      setStep("photo-ready");
    } else {
      setStep("structured-options");
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: "14px", padding: "2rem", width: "100%", maxWidth: "560px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#18160f", margin: 0 }}>Create menu</h2>
            <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.5rem" }}>
              {(["type", "structured-options", "photo-ready"] as Step[]).map((s, i) => (
                <div key={s} style={{ height: "3px", width: "32px", borderRadius: "2px", background: (step === "type" && i === 0) || (step !== "type" && i > 0) ? "#c4410c" : "#f0ede8", transition: "background 0.2s" }} />
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9088", fontSize: "1.25rem", lineHeight: 1, fontFamily: "inherit" }}>×</button>
        </div>

        {error && (
          <div style={{ padding: "0.625rem 0.875rem", background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</div>
        )}

        {/* Step 1: name + type */}
        {step === "type" && (
          <form onSubmit={handleTypeNext} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="label">Menu name</label>
              <input required value={menuName} onChange={(e) => setMenuName(e.target.value)} className="input" placeholder="e.g. Dinner Menu, Drinks…" autoFocus />
            </div>
            <div>
              <label className="label">Menu type</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
                {(["PHOTO", "STRUCTURED"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMenuType(type)}
                    style={{
                      padding: "1.25rem 1rem",
                      borderRadius: "10px",
                      border: menuType === type ? "2px solid #c4410c" : "2px solid rgba(24,22,15,0.12)",
                      background: menuType === type ? "#fef2ec" : "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                      fontFamily: "inherit",
                    }}
                  >
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.375rem" }}>{type === "PHOTO" ? "📷" : "📋"}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#18160f", marginBottom: "0.25rem" }}>
                      {type === "PHOTO" ? "Photo menu" : "Structured menu"}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "#5c5248", lineHeight: 1.4 }}>
                      {type === "PHOTO" ? "Upload photos of your menu" : "Add dishes grouped by category"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="submit" disabled={!menuName.trim() || !menuType} className="btn btn-primary btn-md" style={{ flex: 1 }}>Next →</button>
              <button type="button" onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
            </div>
          </form>
        )}

        {/* Step 2a: photo — just confirm */}
        {step === "photo-ready" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📷</div>
              <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#18160f", margin: "0 0 0.375rem" }}>Ready to upload photos</h3>
              <p style={{ fontSize: "0.875rem", color: "#5c5248", margin: 0 }}>Create the menu and upload your images on the next screen.</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={handleCreate} disabled={saving} className="btn btn-primary btn-md" style={{ flex: 1 }}>{saving ? "Creating…" : "Create menu"}</button>
              <button onClick={() => setStep("type")} className="btn btn-ghost btn-md">Back</button>
            </div>
          </div>
        )}

        {/* Step 2b: structured — preset + layout */}
        {step === "structured-options" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="label">Category preset</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                {MENU_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset)}
                    style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "8px",
                      border: selectedPreset.id === preset.id ? "2px solid #c4410c" : "1px solid rgba(24,22,15,0.12)",
                      background: selectedPreset.id === preset.id ? "#fef2ec" : "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#18160f", marginBottom: "0.25rem" }}>{preset.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#9a9088" }}>{preset.groups.join(" · ")}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Display style</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                {LAYOUT_OPTIONS.map((layout) => (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => setSelectedLayout(layout)}
                    style={{
                      padding: "0.875rem 0.5rem",
                      borderRadius: "8px",
                      border: selectedLayout.id === layout.id ? "2px solid #c4410c" : "1px solid rgba(24,22,15,0.12)",
                      background: selectedLayout.id === layout.id ? "#fef2ec" : "#fff",
                      cursor: "pointer",
                      textAlign: "center",
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#18160f" }}>{layout.name}</div>
                    <div style={{ fontSize: "0.6875rem", color: "#9a9088", marginTop: "0.2rem" }}>{layout.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={handleCreate} disabled={saving} className="btn btn-primary btn-md" style={{ flex: 1 }}>{saving ? "Creating…" : "Create menu"}</button>
              <button onClick={() => setStep("type")} className="btn btn-ghost btn-md">Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
