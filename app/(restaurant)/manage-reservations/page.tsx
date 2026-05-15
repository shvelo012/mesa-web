"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";

const POLL_MS = 30_000;

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: "#fffbeb", color: "#b45309", label: "Pending" },
  CONFIRMED: { bg: "#f0fdf4", color: "#16a34a", label: "Confirmed" },
  CANCELLED: { bg: "#fef2f2", color: "#dc2626", label: "Cancelled" },
  COMPLETED: { bg: "#eff6ff", color: "#2563eb", label: "Completed" },
  NO_SHOW:   { bg: "#f8f8f7", color: "#9a9088", label: "No-show" },
};

type ReservationItem = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  status: string;
  notes?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  user?: { name: string; email: string; phone?: string };
  tableId?: string;
  table?: { label: string };
};

function timeRangesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return s1 <= e2 && e1 >= s2;
}

function getOverlappingPending(
  reservations: ReservationItem[],
  target: ReservationItem,
): ReservationItem[] {
  if (target.status !== "PENDING") return [];
  return reservations.filter(
    (r) =>
      r.id !== target.id &&
      r.status === "PENDING" &&
      r.tableId === target.tableId &&
      r.date === target.date &&
      timeRangesOverlap(r.startTime, r.endTime, target.startTime, target.endTime),
  );
}

type Tab = "PENDING" | "CONFIRMED" | "ALL" | "PAST";

export default function ReservationsPage() {
  const { user, _hasHydrated, can } = useAuthStore();
  const router = useRouter();
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [newCount, setNewCount] = useState(0);
  const prevPendingIds = useRef<Set<string>>(new Set());
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [overlapModal, setOverlapModal] = useState<{
    isOpen: boolean;
    target: ReservationItem;
    group: ReservationItem[];
  } | null>(null);

  const fetchReservations = useCallback(async (isInitial = false) => {
    try {
      const { data } = await api.get<ReservationItem[]>("/reservations/restaurant");
      setReservations(data);
      setLastUpdated(new Date());

      const currentPending = new Set(data.filter((r) => r.status === "PENDING").map((r) => r.id));
      if (!isInitial) {
        const fresh = [...currentPending].filter((id) => !prevPendingIds.current.has(id));
        if (fresh.length > 0) setNewCount((n) => n + fresh.length);
      }
      prevPendingIds.current = currentPending;
    } catch { /* ignore */ }
  }, []);

  // Update document title with pending badge
  useEffect(() => {
    const pending = reservations.filter((r) => r.status === "PENDING").length;
    document.title = pending > 0 ? `(${pending}) Reservations — Mesa` : "Reservations — Mesa";
    return () => { document.title = "Mesa — Restaurant Reservations"; };
  }, [reservations]);

  // Auth guard + initial load
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user || !can("RESERVATIONS_READ")) { router.push("/login"); return; }
    fetchReservations(true).finally(() => setLoading(false));
  }, [user, _hasHydrated, fetchReservations]);

  // Polling
  useEffect(() => {
    const schedule = () => {
      pollTimer.current = setTimeout(async () => {
        await fetchReservations(false);
        schedule();
      }, POLL_MS);
    };
    schedule();
    return () => { if (pollTimer.current) clearTimeout(pollTimer.current); };
  }, [fetchReservations]);

  async function handleStatus(id: string, status: string) {
    setActionLoading(id + status);
    try {
      const { data } = await api.patch(`/reservations/${id}/status`, { status });
      setReservations((rs) => rs.map((r) => r.id === id ? { ...r, status: data.status } : r));
      // update prevPendingIds
      if (status !== "PENDING") {
        prevPendingIds.current.delete(id);
      }
      // Refresh to pick up auto-declined overlapping reservations
      await fetchReservations(false);
    } catch {
      alert("Failed to update reservation.");
    } finally {
      setActionLoading(null);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  const filtered = reservations.filter((r) => {
    if (tab === "PENDING") return r.status === "PENDING";
    if (tab === "CONFIRMED") return r.status === "CONFIRMED" && r.date >= today;
    if (tab === "PAST") return r.date < today || ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(r.status);
    return true;
  });

  const pendingCount = reservations.filter((r) => r.status === "PENDING").length;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f3ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid #f0ede8", borderTopColor: "#c4410c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh" }}>
      {/* Nav */}
      <nav className="nav">
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/dashboard" style={{ textDecoration: "none", color: "#9a9088", fontSize: "0.875rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.35rem", transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#18160f")}
            onMouseLeave={e => (e.currentTarget.style.color = "#9a9088")}
          >
            ← Dashboard
          </Link>
          <div style={{ width: "1px", height: "16px", background: "rgba(24,22,15,0.1)" }} />
          <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>mesa</span>
          <div style={{ flex: 1 }} />
          {lastUpdated && (
            <span style={{ fontSize: "0.75rem", color: "#9a9088" }}>
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => { setNewCount(0); fetchReservations(false); }}
            style={{ padding: "0.375rem 0.625rem", fontSize: "0.8125rem", border: "1px solid rgba(24,22,15,0.1)", borderRadius: "6px", cursor: "pointer", background: "#f5f3ef", color: "#5c5248", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.375rem" }}
          >
            ↻ Refresh
            {newCount > 0 && (
              <span style={{ fontSize: "0.625rem", fontWeight: 700, background: "#c4410c", color: "#fff", padding: "0.05rem 0.35rem", borderRadius: "999px" }}>
                +{newCount} new
              </span>
            )}
          </button>
          <Link href="/new-booking" style={{ textDecoration: "none" }}>
            <button style={{ padding: "0.375rem 0.875rem", fontSize: "0.8125rem", fontWeight: 600, border: "none", borderRadius: "6px", cursor: "pointer", background: "#c4410c", color: "#fff", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              + New booking
            </button>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Header */}
        <div className="anim-1" style={{ opacity: 0, marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.625rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>Reservations</h1>
            <p style={{ fontSize: "0.875rem", color: "#9a9088", marginTop: "0.2rem" }}>
              Auto-refreshes every 30 s · {reservations.length} total
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {(["PENDING", "CONFIRMED", "ALL", "PAST"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); if (t === "PENDING") setNewCount(0); }}
                style={{
                  padding: "0.375rem 0.875rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  fontFamily: "inherit",
                  border: "1px solid",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: tab === t ? "#c4410c" : "#ffffff",
                  borderColor: tab === t ? "#c4410c" : "rgba(24,22,15,0.12)",
                  color: tab === t ? "#ffffff" : "#5c5248",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                }}
              >
                {t === "ALL" ? "All" : t === "PAST" ? "Past" : t.charAt(0) + t.slice(1).toLowerCase()}
                {t === "PENDING" && pendingCount > 0 && (
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, background: tab === "PENDING" ? "rgba(255,255,255,0.3)" : "#c4410c", color: "#fff", padding: "0.1rem 0.35rem", borderRadius: "999px" }}>
                    {pendingCount}
                  </span>
                )}
                {t === "PENDING" && newCount > 0 && tab !== "PENDING" && (
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "#dc2626", color: "#fff", padding: "0.1rem 0.35rem", borderRadius: "999px" }}>
                    +{newCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* New arrivals banner */}
        {newCount > 0 && tab !== "PENDING" && (
          <div
            onClick={() => { setTab("PENDING"); setNewCount(0); }}
            style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "#fffbeb", border: "1px solid rgba(180,83,9,0.3)", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 500, color: "#b45309" }}
          >
            <span>⚡</span>
            {newCount} new reservation request{newCount > 1 ? "s" : ""} arrived — click to review
          </div>
        )}

        {/* Content */}
        <div className="anim-2 card" style={{ opacity: 0, overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem", opacity: 0.25 }}>
                {tab === "PENDING" ? "✓" : "○"}
              </div>
              <p style={{ fontSize: "1rem", fontWeight: 600, color: "#18160f", marginBottom: "0.375rem" }}>
                {tab === "PENDING" ? "All caught up" : "Nothing here"}
              </p>
              <p style={{ fontSize: "0.875rem", color: "#9a9088" }}>
                {tab === "PENDING" ? "No pending reservation requests right now." : "No reservations in this category."}
              </p>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 90px 60px 110px 180px", gap: "1rem", padding: "0.625rem 1.5rem", background: "#fafaf8", borderBottom: "1px solid rgba(24,22,15,0.07)" }}>
                {["Guest", "Date & Time", "Table", "Party", "Status", "Actions"].map((h) => (
                  <span key={h} style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
                ))}
              </div>

              {filtered.map((r, i) => {
                const name = r.user?.name || r.guestName || "Guest";
                const email = r.user?.email || r.guestEmail || "";
                const phone = (r.user?.phone || r.guestPhone || "").toString();
                const st = STATUS_STYLE[r.status] || STATUS_STYLE.PENDING;
                const isPending = r.status === "PENDING";
                const isConfirmed = r.status === "CONFIRMED";
                const busy = !!actionLoading;
                const overlaps = isPending ? getOverlappingPending(reservations, r) : [];
                const hasOverlap = overlaps.length > 0;

                return (
                  <div
                    key={r.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.4fr 1fr 90px 60px 110px 180px",
                      gap: "1rem",
                      padding: "1rem 1.5rem",
                      borderTop: i === 0 ? "none" : "1px solid rgba(24,22,15,0.06)",
                      alignItems: "center",
                      background: hasOverlap
                        ? "rgba(254,226,226,0.6)"
                        : isPending
                          ? "rgba(255,251,235,0.5)"
                          : "transparent",
                      transition: "background 0.2s",
                    }}
                  >
                    {/* Guest */}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#18160f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {name}
                      </p>
                      {email && (
                        <a href={`mailto:${email}`} style={{ fontSize: "0.75rem", color: "#9a9088", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {email}
                        </a>
                      )}
                      {phone && (
                        <a href={`tel:${phone}`} style={{ fontSize: "0.75rem", color: "#9a9088", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {phone}
                        </a>
                      )}
                      {r.notes && (
                        <p style={{ fontSize: "0.7rem", color: "#5c5248", marginTop: "0.2rem", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.notes}>
                          "{r.notes}"
                        </p>
                      )}
                    </div>

                    {/* Date & Time */}
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#18160f" }}>{r.date}</p>
                      <p style={{ fontSize: "0.75rem", color: "#9a9088" }}>{r.startTime} – {r.endTime}</p>
                    </div>

                    {/* Table */}
                    <div>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: r.table ? "#18160f" : "#c8c4be" }}>
                        {r.table ? `T${r.table.label}` : "—"}
                      </span>
                    </div>

                    {/* Party */}
                    <div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#18160f" }}>{r.partySize}p</span>
                    </div>

                    {/* Status */}
                    <div>
                      <span className="badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
                      {isPending && hasOverlap && (
                        <button
                          onClick={() => setOverlapModal({ isOpen: true, target: r, group: overlaps })}
                          disabled={busy}
                          title="Overlapping requests"
                          style={{
                            padding: "0.35rem 0.55rem",
                            fontSize: "0.8125rem",
                            fontWeight: 700,
                            fontFamily: "inherit",
                            border: "none",
                            borderRadius: "6px",
                            cursor: busy ? "not-allowed" : "pointer",
                            background: "#dc2626",
                            color: "#fff",
                            opacity: busy ? 0.65 : 1,
                            transition: "opacity 0.15s",
                            lineHeight: 1,
                            minWidth: "28px",
                          }}
                        >
                          !
                        </button>
                      )}
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleStatus(r.id, "CONFIRMED")}
                            disabled={busy}
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit", border: "none", borderRadius: "6px", cursor: busy ? "not-allowed" : "pointer", background: "#16a34a", color: "#fff", opacity: actionLoading === r.id + "CONFIRMED" ? 0.65 : 1, transition: "opacity 0.15s" }}
                          >
                            {actionLoading === r.id + "CONFIRMED" ? "…" : "Accept"}
                          </button>
                          <button
                            onClick={() => handleStatus(r.id, "CANCELLED")}
                            disabled={busy}
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit", border: "none", borderRadius: "6px", cursor: busy ? "not-allowed" : "pointer", background: "#fef2f2", color: "#dc2626", opacity: actionLoading === r.id + "CANCELLED" ? 0.65 : 1, transition: "opacity 0.15s" }}
                          >
                            {actionLoading === r.id + "CANCELLED" ? "…" : "Decline"}
                          </button>
                        </>
                      )}
                      {isConfirmed && (
                        <>
                          <button
                            onClick={() => handleStatus(r.id, "COMPLETED")}
                            disabled={busy}
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit", border: "none", borderRadius: "6px", cursor: busy ? "not-allowed" : "pointer", background: "#eff6ff", color: "#2563eb", opacity: actionLoading === r.id + "COMPLETED" ? 0.65 : 1, transition: "opacity 0.15s" }}
                          >
                            {actionLoading === r.id + "COMPLETED" ? "…" : "Complete"}
                          </button>
                          <button
                            onClick={() => handleStatus(r.id, "CANCELLED")}
                            disabled={busy}
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit", border: "none", borderRadius: "6px", cursor: busy ? "not-allowed" : "pointer", background: "#f5f3ef", color: "#9a9088", opacity: actionLoading === r.id + "CANCELLED" ? 0.65 : 1, transition: "opacity 0.15s" }}
                          >
                            {actionLoading === r.id + "CANCELLED" ? "…" : "Cancel"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Overlap Modal */}
      {overlapModal?.isOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOverlapModal(null); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
              animation: "slideUp 0.2s ease",
            }}
          >
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid rgba(24,22,15,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
                background: "#ffffff",
                zIndex: 1,
              }}
            >
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.01em" }}>
                  Overlapping Requests
                </h3>
                <p style={{ fontSize: "0.75rem", color: "#9a9088", marginTop: "0.15rem" }}>
                  Table {overlapModal.target.table?.label} · {overlapModal.target.date} · Accepting one will decline the others
                </p>
              </div>
              <button
                onClick={() => setOverlapModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9a9088",
                  fontSize: "1.375rem",
                  lineHeight: 1,
                  padding: "0.25rem",
                  borderRadius: "6px",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "0.75rem 1.25rem" }}>
              {[overlapModal.target, ...overlapModal.group].map((item) => {
                const itemName = item.user?.name || item.guestName || "Guest";
                const isTarget = item.id === overlapModal.target.id;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 110px 90px",
                      gap: "0.75rem",
                      alignItems: "center",
                      padding: "0.75rem 0",
                      borderTop: "1px solid rgba(24,22,15,0.06)",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#18160f" }}>
                        {itemName} {isTarget && (
                          <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#dc2626", background: "#fef2f2", padding: "0.1rem 0.4rem", borderRadius: "999px", marginLeft: "0.25rem" }}>
                            This request
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#9a9088", marginTop: "0.1rem" }}>
                        {item.startTime} – {item.endTime} · {item.partySize} guests
                      </p>
                      {item.notes && (
                        <p style={{ fontSize: "0.7rem", color: "#5c5248", marginTop: "0.15rem", fontStyle: "italic" }}>
                          “{item.notes}”
                        </p>
                      )}
                    </div>
                    <div>
                      <span
                        className="badge"
                        style={{
                          background: item.status === "PENDING" ? "#fffbeb" : STATUS_STYLE[item.status]?.bg || "#f0ede8",
                          color: item.status === "PENDING" ? "#b45309" : STATUS_STYLE[item.status]?.color || "#5c5248",
                        }}
                      >
                        {item.status === "PENDING" ? "Pending" : STATUS_STYLE[item.status]?.label || item.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      {item.status === "PENDING" && (
                        <button
                          onClick={() => {
                            setOverlapModal(null);
                            handleStatus(item.id, "CONFIRMED");
                          }}
                          disabled={!!actionLoading}
                          style={{
                            padding: "0.35rem 0.75rem",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            fontFamily: "inherit",
                            border: "none",
                            borderRadius: "6px",
                            cursor: actionLoading ? "not-allowed" : "pointer",
                            background: "#16a34a",
                            color: "#fff",
                            opacity: actionLoading ? 0.65 : 1,
                            transition: "opacity 0.15s",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {actionLoading === item.id + "CONFIRMED" ? "…" : "Accept"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
