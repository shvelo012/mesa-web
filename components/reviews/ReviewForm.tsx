"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Review } from "@/types";
import StarRating from "./StarRating";

interface ReviewFormProps {
  restaurantId: string;
  existing?: Review;
  onSaved: (review: Review) => void;
  onCancel?: () => void;
}

export default function ReviewForm({ restaurantId, existing, onSaved, onCancel }: ReviewFormProps) {
  const [stars, setStars] = useState(existing?.stars ?? 0);
  const [text, setText] = useState(existing?.text ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const isEdit = !!existing;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stars === 0) { setErr("Pick at least 1 star"); return; }
    setErr("");
    setSubmitting(true);
    try {
      let data: Review;
      if (isEdit) {
        ({ data } = await api.patch(`/reviews/${existing.id}`, { stars, text: text || null }));
      } else {
        ({ data } = await api.post(`/restaurants/${restaurantId}/reviews`, { stars, text: text || null }));
      }
      onSaved(data);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setErr(msg || "Failed to save review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <div>
        <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#5c5248", display: "block", marginBottom: "0.375rem" }}>
          Rating
        </label>
        <StarRating value={stars} onChange={setStars} size={28} />
      </div>
      <div>
        <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#5c5248", display: "block", marginBottom: "0.375rem" }}>
          Review <span style={{ fontWeight: 400, color: "#9a9088" }}>(optional)</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="input"
          placeholder="Tell others about your experience…"
          maxLength={1000}
        />
      </div>
      {err && (
        <p style={{ fontSize: "0.8125rem", color: "#dc2626" }}>{err}</p>
      )}
      {isEdit && (
        <p style={{ fontSize: "0.75rem", color: "#b45309" }}>
          You can only edit your review once. This action cannot be undone.
        </p>
      )}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
          {submitting ? "Saving…" : isEdit ? "Save edit" : "Submit review"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
