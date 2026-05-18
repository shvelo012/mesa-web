"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: "Pending",   color: "#b45309", bg: "#fffbeb" },
  CONFIRMED: { label: "Confirmed", color: "#16a34a", bg: "#f0fdf4" },
  CANCELLED: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2" },
  COMPLETED: { label: "Completed", color: "#2563eb", bg: "#eff6ff" },
  NO_SHOW:   { label: "No-show",   color: "#9a9088", bg: "#f8f8f7" },
};

function fmt(date: string) {
  if (!date) return "";
  const d = new Date(date + "T00:00");
  return d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
}

type ReportData = {
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    noShow: number;
  };
  daily: Record<string, { total: number; confirmed: number; pending: number; cancelled: number }>;
  upcoming: {
    id: string;
    date: string;
    startTime: string;
    partySize: number;
    status: string;
    guestName: string;
    guestEmail: string | null;
    tableLabel: string | null;
  }[];
};

export default function ReportsPage() {
  const { user, _hasHydrated, can } = useAuthStore();
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user || !can("REPORTS")) { router.push("/dashboard"); return; }
    api.get("/reservations/report")
      .then(({ data }) => setReport(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, _hasHydrated, can, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f3ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid #f0ede8", borderTopColor: "#c4410c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const stats = report?.stats;
  const daily = report?.daily ?? {};
  const upcoming = report?.upcoming ?? [];
  const days = Object.keys(daily).sort();

  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh" }}>
      {/* Nav */}
      <nav className="nav">
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link href="/dashboard" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em", textDecoration: "none" }}>mesa</Link>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#c4410c", background: "#fef2ec", padding: "0.2rem 0.625rem", borderRadius: "999px" }}>
              {user?.role === "RESTAURANT_OWNER" ? "Owner" : "Staff"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link href="/dashboard" style={{ fontSize: "0.875rem", color: "#5c5248", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/manage-reservations" style={{ fontSize: "0.875rem", color: "#5c5248", textDecoration: "none" }}>Reservations</Link>
            <Link href="/menu" style={{ fontSize: "0.875rem", color: "#5c5248", textDecoration: "none" }}>Menu</Link>
            <Link href="/settings" style={{ fontSize: "0.875rem", color: "#5c5248", textDecoration: "none" }}>Settings</Link>
            {can("STAFF_MANAGE") && (
              <Link href="/dashboard/staff" style={{ fontSize: "0.875rem", color: "#5c5248", textDecoration: "none" }}>Staff</Link>
            )}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <div className="anim-1" style={{ opacity: 0, marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>Reports</h1>
          <p style={{ fontSize: "0.9375rem", color: "#9a9088", marginTop: "0.25rem" }}>Reservation overview and upcoming bookings</p>
        </div>

        {/* Stats */}
        <div className="anim-2" style={{ opacity: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {stats && [
            { label: "Total", value: stats.total, color: "#18160f" },
            { label: "Pending", value: stats.pending, color: "#b45309" },
            { label: "Confirmed", value: stats.confirmed, color: "#16a34a" },
            { label: "Cancelled", value: stats.cancelled, color: "#dc2626" },
            { label: "Completed", value: stats.completed, color: "#2563eb" },
            { label: "No-show", value: stats.noShow, color: "#9a9088" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ padding: "1.25rem 1.5rem" }}>
              <p style={{ fontSize: "1.75rem", fontWeight: 700, color, letterSpacing: "-0.02em" }}>{value}</p>
              <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginTop: "0.25rem" }}>{label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem", alignItems: "start" }}>
          {/* Daily breakdown */}
          <div className="anim-3 card" style={{ opacity: 0, overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(24,22,15,0.07)", background: "#fafaf8" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#18160f" }}>Daily breakdown</h2>
            </div>
            {days.length === 0 ? (
              <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
                <p style={{ fontSize: "0.9375rem", color: "#9a9088" }}>No upcoming reservations</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {days.map((d, i) => {
                  const day = daily[d];
                  return (
                    <div key={d} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px", gap: "1rem", padding: "0.875rem 1.5rem", borderTop: i === 0 ? "none" : "1px solid rgba(24,22,15,0.06)", alignItems: "center" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#18160f" }}>{fmt(d)}</span>
                      <span style={{ fontSize: "0.8125rem", color: "#5c5248", textAlign: "center" }}>{day.total}</span>
                      <span style={{ fontSize: "0.8125rem", color: "#16a34a", textAlign: "center" }}>{day.confirmed}</span>
                      <span style={{ fontSize: "0.8125rem", color: "#b45309", textAlign: "center" }}>{day.pending}</span>
                      <span style={{ fontSize: "0.8125rem", color: "#dc2626", textAlign: "center" }}>{day.cancelled}</span>
                    </div>
                  );
                })}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px", gap: "1rem", padding: "0.625rem 1.5rem", background: "#fafaf8", borderTop: "1px solid rgba(24,22,15,0.07)", fontSize: "0.6875rem", fontWeight: 600, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <span>Date</span>
                  <span style={{ textAlign: "center" }}>Total</span>
                  <span style={{ textAlign: "center" }}>Confirmed</span>
                  <span style={{ textAlign: "center" }}>Pending</span>
                  <span style={{ textAlign: "center" }}>Cancelled</span>
                </div>
              </div>
            )}
          </div>

          {/* Upcoming list */}
          <div className="anim-4 card" style={{ opacity: 0, overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(24,22,15,0.07)", background: "#fafaf8" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#18160f" }}>Next 7 days</h2>
            </div>
            {upcoming.length === 0 ? (
              <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
                <p style={{ fontSize: "0.9375rem", color: "#9a9088" }}>No upcoming reservations</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {upcoming.map((r, i) => {
                  const st = STATUS_LABELS[r.status] || STATUS_LABELS.PENDING;
                  return (
                    <div key={r.id} style={{ padding: "0.875rem 1.5rem", borderTop: i === 0 ? "none" : "1px solid rgba(24,22,15,0.06)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#18160f" }}>{fmt(r.date)}</span>
                        <span className="badge" style={{ background: st.bg, color: st.color, fontSize: "0.6875rem" }}>{st.label}</span>
                      </div>
                      <span style={{ fontSize: "0.8125rem", color: "#5c5248" }}>
                        {r.startTime} · Table {r.tableLabel ?? "—"} · {r.partySize}p
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#9a9088" }}>{r.guestName}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
