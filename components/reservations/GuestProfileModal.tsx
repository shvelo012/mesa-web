"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useTranslation } from "react-i18next";

type GuestReservation = {
  id: string;
  date: string;
  startTime: string;
  partySize: number;
  status: string;
  table?: { label: string };
  notes?: string;
};

type GuestNote = {
  id: string;
  note: string;
  createdAt: string;
};

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: "#fffbeb", color: "#b45309" },
  CONFIRMED: { bg: "#f0fdf4", color: "#16a34a" },
  CANCELLED: { bg: "#f8f8f7", color: "#9a9088" },
  COMPLETED: { bg: "#eff6ff", color: "#2563eb" },
  NO_SHOW:   { bg: "#fef2f2", color: "#dc2626" },
};

interface Props {
  guestEmail: string;
  guestName: string;
  onClose: () => void;
}

export default function GuestProfileModal({ guestEmail, guestName, onClose }: Props) {
  const { t } = useTranslation();
  const [reservations, setReservations] = useState<GuestReservation[]>([]);
  const [notes, setNotes] = useState<GuestNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/guests/${encodeURIComponent(guestEmail)}/history`);
      setReservations(data.reservations || []);
      setNotes(data.notes || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [guestEmail]);

  useEffect(() => {
    load();
  }, [load]);

  async function addNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const { data } = await api.post(`/guests/${encodeURIComponent(guestEmail)}/notes`, { note: newNote.trim() });
      setNotes((n) => [data, ...n]);
      setNewNote("");
    } catch {
      // ignore
    } finally {
      setAddingNote(false);
    }
  }

  async function deleteNote(noteId: string) {
    try {
      await api.delete(`/guests/notes/${noteId}`);
      setNotes((n) => n.filter((note) => note.id !== noteId));
    } catch {
      // ignore
    }
  }

  const total = reservations.length;
  const noShows = reservations.filter((r) => r.status === "NO_SHOW").length;
  const confirmed = reservations.filter((r) => r.status === "CONFIRMED" || r.status === "COMPLETED").length;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
    >
      <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}>
        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(24,22,15,0.08)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#18160f", margin: 0 }}>{guestName}</h3>
            <a href={`mailto:${guestEmail}`} style={{ fontSize: "0.8125rem", color: "#9a9088", textDecoration: "none" }}>{guestEmail}</a>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9088", fontSize: "1.375rem", lineHeight: 1 }}>×</button>
        </div>

        {/* Stats */}
        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem", padding: "0.875rem 1.5rem", borderBottom: "1px solid rgba(24,22,15,0.06)" }}>
            {[
              { label: t("guestProfile.totalVisits"), value: total, color: "#18160f" },
              { label: t("guestProfile.confirmed"), value: confirmed, color: "#16a34a" },
              { label: t("guestProfile.noShows"), value: noShows, color: noShows > 0 ? "#dc2626" : "#18160f" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: "1.375rem", fontWeight: 700, color, margin: 0 }}>{value}</p>
                <p style={{ fontSize: "0.75rem", color: "#9a9088", margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <div style={{ width: "28px", height: "28px", border: "2px solid #f0ede8", borderTopColor: "#c4410c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : (
            <>
              {/* Reservation history */}
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.625rem" }}>
                  {t("guestProfile.reservationHistory")}
                </p>
                {reservations.length === 0 ? (
                  <p style={{ fontSize: "0.875rem", color: "#9a9088" }}>{t("guestProfile.noReservations")}</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {reservations.map((r) => {
                      const s = STATUS_BADGE[r.status] || STATUS_BADGE.PENDING;
                      return (
                        <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", background: "#fafaf8", borderRadius: "8px", gap: "0.5rem" }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#18160f", margin: 0 }}>
                              {r.date} · {r.startTime}
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "#9a9088", margin: 0 }}>
                              {r.partySize} guests{r.table ? ` · Table ${r.table.label}` : ""}
                            </p>
                          </div>
                          <span className="badge" style={{ background: s.bg, color: s.color, flexShrink: 0 }}>
                            {r.status.toLowerCase()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Staff notes */}
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.625rem" }}>
                  {t("guestProfile.staffNotes")}
                </p>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.625rem" }}>
                  <input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addNote()}
                    placeholder={t("guestProfile.addNote")}
                    className="input"
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={addNote}
                    disabled={!newNote.trim() || addingNote}
                    className="btn btn-primary btn-sm"
                    style={{ flexShrink: 0 }}
                  >
                    {addingNote ? "…" : t("guestProfile.add")}
                  </button>
                </div>
                {notes.length === 0 ? (
                  <p style={{ fontSize: "0.875rem", color: "#9a9088" }}>{t("guestProfile.noNotes")}</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {notes.map((n) => (
                      <div key={n.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0.5rem 0.75rem", background: "#fffbeb", borderRadius: "8px", gap: "0.5rem" }}>
                        <div>
                          <p style={{ fontSize: "0.875rem", color: "#18160f", margin: 0 }}>{n.note}</p>
                          <p style={{ fontSize: "0.7rem", color: "#9a9088", margin: "0.2rem 0 0" }}>
                            {new Date(n.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteNote(n.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9088", fontSize: "1rem", lineHeight: 1, flexShrink: 0 }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
