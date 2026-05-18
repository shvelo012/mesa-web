"use client";

import { useState } from "react";
import { MenuItem, DietaryTag } from "@/types";
import { DIETARY_TAG_LABELS, ALL_DIETARY_TAGS } from "@/lib/menu-presets";

interface Props {
  onSave: (data: {
    name: string;
    price: number;
    description: string;
    dietaryTags: DietaryTag[];
  }) => Promise<void>;
  onCancel: () => void;
  initial?: Partial<MenuItem>;
}

export default function MenuItemForm({ onSave, onCancel, initial }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [dietaryTags, setDietaryTags] = useState<DietaryTag[]>(
    initial?.dietaryTags ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleTag(tag: DietaryTag) {
    setDietaryTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedPrice = parseFloat(price);
    if (!name.trim() || isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Name and valid price required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        name: name.trim(),
        price: parsedPrice,
        description: description.trim(),
        dietaryTags,
      });
    } catch {
      setError("Failed to save item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
    >
      {error && (
        <div
          style={{
            padding: "0.5rem 0.75rem",
            background: "#fef2f2",
            border: "1px solid rgba(220,38,38,0.2)",
            borderRadius: "6px",
            color: "#dc2626",
            fontSize: "0.8125rem",
          }}
        >
          {error}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 120px",
          gap: "0.625rem",
        }}
      >
        <div>
          <label className="label">Dish name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="e.g. Grilled Salmon"
          />
        </div>
        <div>
          <label className="label">Price</label>
          <input
            required
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input"
            placeholder="0.00"
          />
        </div>
      </div>
      <div>
        <label className="label">
          Description{" "}
          <span style={{ fontWeight: 400, color: "#9a9088" }}>(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="input"
          placeholder="Short description…"
          style={{ resize: "vertical" }}
        />
      </div>
      <div>
        <label className="label">Dietary tags</label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.375rem",
            marginTop: "0.375rem",
          }}
        >
          {ALL_DIETARY_TAGS.map((tag) => {
            const active = dietaryTags.includes(tag as DietaryTag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag as DietaryTag)}
                style={{
                  padding: "0.25rem 0.625rem",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  border: active
                    ? "1px solid #c4410c"
                    : "1px solid rgba(24,22,15,0.16)",
                  background: active ? "#fef2ec" : "#fff",
                  color: active ? "#c4410c" : "#5c5248",
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                }}
              >
                {DIETARY_TAG_LABELS[tag]}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary btn-sm"
        >
          {saving ? "Saving…" : initial?.id ? "Update dish" : "Add dish"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost btn-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
