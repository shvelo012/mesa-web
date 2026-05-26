"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Stats {
  totalUsers: number;
  totalRestaurants: number;
  totalSubscriptions: number;
  byStatus: { status: string; count: string }[];
  byPlan: { "plan.name": string; "plan.slug": string; count: string }[];
}

const STATUS_COLOR: Record<string, string> = {
  TRIALING: "#f59e0b",
  ACTIVE: "#22c55e",
  PAST_DUE: "#ef4444",
  CANCELLED: "#6b7280",
  EXPIRED: "#6b7280",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: "rgba(255,255,255,0.4)" }}>Loading…</p>;
  if (!stats) return <p style={{ color: "#ef4444" }}>Failed to load stats.</p>;

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "2rem", color: "#fff" }}>Overview</h1>

      {/* Top cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Users", value: stats.totalUsers },
          { label: "Restaurants", value: stats.totalRestaurants },
          { label: "Subscriptions", value: stats.totalSubscriptions },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: "#1e1b14",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            padding: "1.25rem 1.5rem",
          }}>
            <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem" }}>{label}</p>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em" }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* By status */}
        <div style={{ background: "#1e1b14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "1.25rem 1.5rem" }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: "1rem" }}>By Status</p>
          {stats.byStatus.length === 0 && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>No subscriptions yet</p>}
          {stats.byStatus.map((s) => (
            <div key={s.status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: STATUS_COLOR[s.status] || "#6b7280", display: "inline-block" }} />
                {s.status}
              </span>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}>{s.count}</span>
            </div>
          ))}
        </div>

        {/* By plan */}
        <div style={{ background: "#1e1b14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "1.25rem 1.5rem" }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: "1rem" }}>By Plan</p>
          {stats.byPlan.length === 0 && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>No subscriptions yet</p>}
          {stats.byPlan.map((p) => (
            <div key={p["plan.slug"]} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.7)" }}>{p["plan.name"]}</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}>{p.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
