"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Reservation } from "@/types";

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Pending",   cls: "badge-pending" },
  CONFIRMED: { label: "Confirmed", cls: "badge-confirmed" },
  CANCELLED: { label: "Cancelled", cls: "badge-cancelled" },
  COMPLETED: { label: "Completed", cls: "badge-completed" },
  NO_SHOW:   { label: "No Show",   cls: "badge-no-show" },
};

function fmt(date: string) {
  if (!date) return "";
  const d = new Date(date + "T00:00");
  return d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
}

export default function MyReservationsPage() {
  const { user, logout, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push("/login"); return; }
    api.get("/reservations/my").then(({ data }) => setReservations(data)).finally(() => setLoading(false));
  }, [user, _hasHydrated]);

  async function cancel(id: string) {
    await api.patch(`/reservations/${id}/cancel`);
    setReservations((rs) => rs.map((r) => r.id === id ? { ...r, status: "CANCELLED" } : r));
  }

  const upcoming = reservations.filter((r) => r.status !== "CANCELLED" && r.status !== "COMPLETED" && r.status !== "NO_SHOW");
  const past = reservations.filter((r) => r.status === "CANCELLED" || r.status === "COMPLETED" || r.status === "NO_SHOW");

  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh" }}>
      {/* Nav */}
      <nav className="nav">
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/restaurants" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#18160f", textDecoration: "none", letterSpacing: "-0.02em" }}>mesa</Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {user && <span style={{ fontSize: "0.875rem", color: "#9a9088" }}>{user.name}</span>}
            <button className="btn btn-ghost btn-sm" onClick={() => { logout(); router.push("/"); }}>Sign out</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* Header */}
        <div className="anim-1" style={{ opacity: 0, marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>
            My Reservations
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "#9a9088", marginTop: "0.375rem" }}>
            {reservations.length > 0 ? `${reservations.length} total reservations` : "No reservations yet"}
          </p>
        </div>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card" style={{ height: "88px", background: "linear-gradient(90deg, #f0ede8, #e8e4de, #f0ede8)" }} />
            ))}
          </div>
        )}

        {!loading && reservations.length === 0 && (
          <div className="card" style={{ padding: "4rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🍽️</div>
            <p style={{ fontSize: "1.125rem", fontWeight: 600, color: "#18160f", marginBottom: "0.5rem" }}>No reservations yet</p>
            <p style={{ fontSize: "0.9375rem", color: "#9a9088", marginBottom: "1.5rem" }}>Browse restaurants and book your first table.</p>
            <Link href="/restaurants" className="btn btn-primary btn-md" style={{ textDecoration: "none" }}>Find a table</Link>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="anim-2" style={{ opacity: 0, marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>
              Upcoming
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {upcoming.map((r) => {
                const st = STATUS[r.status] || STATUS.CANCELLED;
                return (
                  <div key={r.id} className="card" style={{ padding: "1.125rem 1.25rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    {/* Date badge */}
                    <div style={{ flexShrink: 0, width: "52px", height: "52px", background: "#fef2ec", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "#c4410c", lineHeight: 1 }}>
                        {r.date?.split("-")[2]}
                      </span>
                      <span style={{ fontSize: "0.625rem", fontWeight: 600, color: "#c4410c", textTransform: "uppercase", marginTop: "1px" }}>
                        {r.date ? new Date(r.date + "T00:00").toLocaleString("en", { month: "short" }) : ""}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#18160f" }}>
                        {fmt(r.date)}
                      </p>
                      <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginTop: "0.15rem" }}>
                        {r.startTime} · Table {r.table?.label} · {r.partySize} guests
                      </p>
                      {r.notes && <p style={{ fontSize: "0.8125rem", color: "#5c5248", marginTop: "0.15rem", fontStyle: "italic" }}>{r.notes}</p>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flexShrink: 0 }}>
                      <span className={`badge ${st.cls}`}>{st.label}</span>
                      {r.status === "PENDING" && (
                        <button
                          onClick={() => cancel(r.id)}
                          className="btn btn-sm"
                          style={{ background: "#fef2f2", color: "#dc2626", border: "none", fontFamily: "inherit" }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Past */}
        {past.length > 0 && (
          <div className="anim-3" style={{ opacity: 0 }}>
            <h2 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>
              Past
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {past.map((r) => {
                const st = STATUS[r.status] || STATUS.CANCELLED;
                return (
                  <div key={r.id} className="card" style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1.25rem", opacity: 0.65 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#18160f" }}>
                        {fmt(r.date)} · {r.startTime}
                      </p>
                      <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginTop: "0.1rem" }}>
                        Table {r.table?.label} · {r.partySize} guests
                      </p>
                    </div>
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
