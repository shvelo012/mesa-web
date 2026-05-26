"use client";

import { useState } from "react";
import { Review } from "@/types";
import { api } from "@/lib/api";
import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";
import { useTranslation } from "react-i18next";

interface ReviewListProps {
  reviews: Review[];
  avgStars: number | null;
  count: number;
  currentUserId?: string;
  restaurantId: string;
  canReview: boolean;
  onChanged: (reviews: Review[], avg: number | null, count: number) => void;
}

export default function ReviewList({
  reviews,
  avgStars,
  count,
  currentUserId,
  restaurantId,
  canReview,
  onChanged,
}: ReviewListProps) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const myReview = reviews.find((r) => r.userId === currentUserId);

  function recalc(updated: Review[]) {
    const avg = updated.length ? Math.round((updated.reduce((s, r) => s + r.stars, 0) / updated.length) * 10) / 10 : null;
    onChanged(updated, avg, updated.length);
  }

  function handleSaved(review: Review) {
    let updated: Review[];
    if (reviews.find((r) => r.id === review.id)) {
      updated = reviews.map((r) => (r.id === review.id ? review : r));
    } else {
      updated = [review, ...reviews];
    }
    recalc(updated);
    setShowForm(false);
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await api.delete(`/reviews/${id}`);
      const updated = reviews.filter((r) => r.id !== id);
      recalc(updated);
    } catch {
      // silently ignore
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {avgStars !== null ? (
          <>
            <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#18160f", lineHeight: 1 }}>{avgStars.toFixed(1)}</span>
            <div>
              <StarRating value={Math.round(avgStars)} readonly size={18} />
              <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginTop: "0.2rem" }}>
                {t("reviews.totalReviews", { count })}
              </p>
            </div>
          </>
        ) : (
          <p style={{ fontSize: "0.9375rem", color: "#9a9088" }}>{t("reviews.noReviews")}</p>
        )}
        <div style={{ flex: 1 }} />
        {canReview && !myReview && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
            {t("reviews.writeReview")}
          </button>
        )}
      </div>

      {/* Write form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1px solid rgba(24,22,15,0.1)", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.25rem" }}>
          <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#18160f", marginBottom: "1rem" }}>{t("reviews.writeReview")}</h4>
          <ReviewForm restaurantId={restaurantId} onSaved={handleSaved} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Review list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {reviews.map((r) => {
          const isOwn = r.userId === currentUserId;
          const isEditing = editingId === r.id;
          return (
            <div key={r.id} style={{ background: "#fff", border: "1px solid rgba(24,22,15,0.08)", borderRadius: "10px", padding: "1.125rem 1.25rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#18160f" }}>{r.user?.name ?? "Guest"}</span>
                  {r.edited && <span style={{ fontSize: "0.7rem", color: "#9a9088", marginLeft: "0.5rem" }}>{t("reviews.edited")}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexShrink: 0 }}>
                  <StarRating value={r.stars} readonly size={14} />
                  <span style={{ fontSize: "0.75rem", color: "#9a9088" }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {isEditing ? (
                <ReviewForm restaurantId={restaurantId} existing={r} onSaved={handleSaved} onCancel={() => setEditingId(null)} />
              ) : (
                <>
                  {r.text && <p style={{ fontSize: "0.9375rem", color: "#3c3530", lineHeight: 1.6 }}>{r.text}</p>}
                  {isOwn && (
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                      {!r.edited && (
                        <button onClick={() => setEditingId(r.id)} className="btn btn-ghost btn-sm" style={{ fontSize: "0.75rem" }}>
                          {t("common.edit")}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={deleting === r.id}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: "0.75rem", color: "#dc2626" }}
                      >
                        {deleting === r.id ? t("common.loading") : t("reviews.deleteReview")}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
