"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Subscription, Plan, SubscriptionStatus } from "@/types";

const STATUS_COLOR: Record<string, string> = {
  TRIALING: "#f59e0b",
  ACTIVE: "#22c55e",
  PAST_DUE: "#ef4444",
  CANCELLED: "#6b7280",
  EXPIRED: "#6b7280",
};

const ALL_STATUSES: SubscriptionStatus[] = ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"];

function NewSubModal({ plans, onClose, onCreated }: { plans: Plan[]; onClose: () => void; onCreated: () => void }) {
  const [restaurantId, setRestaurantId] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [status, setStatus] = useState<SubscriptionStatus>("TRIALING");
  const [trialEnd, setTrialEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      await api.post("/admin/subscriptions", {
        restaurantId, planId, status,
        trialEndsAt: trialEnd ? new Date(trialEnd).toISOString() : undefined,
      });
      onCreated();
      onClose();
    } catch (ex: unknown) {
      setErr((ex as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed");
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <form onSubmit={submit} style={{ background: "#1e1b14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "1.75rem", width: "420px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "1.25rem" }}>New Subscription</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div>
            <label style={labelStyle}>Restaurant ID (UUID)</label>
            <input value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} required placeholder="paste restaurant id" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Plan</label>
            <select value={planId} onChange={(e) => setPlanId(e.target.value)} style={inputStyle}>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as SubscriptionStatus)} style={inputStyle}>
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Trial ends at (optional)</label>
            <input type="datetime-local" value={trialEnd} onChange={(e) => setTrialEnd(e.target.value)} style={inputStyle} />
          </div>
        </div>
        {err && <p style={{ color: "#ef4444", fontSize: "0.8125rem", marginBottom: "0.75rem" }}>{err}</p>}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "…" : "Create"}</button>
          <button type="button" onClick={onClose} style={btnGhost}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function EditStatusModal({ sub, onClose, onUpdated }: { sub: Subscription; onClose: () => void; onUpdated: () => void }) {
  const [status, setStatus] = useState<SubscriptionStatus>(sub.status);
  const [trialEnd, setTrialEnd] = useState(sub.trialEndsAt ? sub.trialEndsAt.slice(0, 16) : "");
  const [periodEnd, setPeriodEnd] = useState(sub.currentPeriodEnd ? sub.currentPeriodEnd.slice(0, 16) : "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      await api.patch(`/admin/subscriptions/${sub.id}`, {
        status,
        trialEndsAt: trialEnd ? new Date(trialEnd).toISOString() : null,
        currentPeriodEnd: periodEnd ? new Date(periodEnd).toISOString() : null,
      });
      onUpdated();
      onClose();
    } catch (ex: unknown) {
      setErr((ex as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed");
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <form onSubmit={submit} style={{ background: "#1e1b14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "1.75rem", width: "380px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Edit Subscription</h3>
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)", marginBottom: "1.25rem" }}>{sub.restaurant?.name}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as SubscriptionStatus)} style={inputStyle}>
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Trial ends at</label>
            <input type="datetime-local" value={trialEnd} onChange={(e) => setTrialEnd(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Current period end</label>
            <input type="datetime-local" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} style={inputStyle} />
          </div>
        </div>
        {err && <p style={{ color: "#ef4444", fontSize: "0.8125rem", marginBottom: "0.75rem" }}>{err}</p>}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "…" : "Save"}</button>
          <button type="button" onClick={onClose} style={btnGhost}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subsRes, plansRes] = await Promise.all([
        api.get("/admin/subscriptions", { params: { page: String(page), limit: String(LIMIT), ...(statusFilter ? { status: statusFilter } : {}) } }),
        api.get("/admin/plans"),
      ]);
      setSubs(subsRes.data.subscriptions);
      setTotal(subsRes.data.total);
      setPlans(plansRes.data);
    } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>
          Subscriptions <span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>({total})</span>
        </h1>
        <button onClick={() => setShowNew(true)} style={btnPrimary}>+ New</button>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={inputStyle}>
          <option value="">All statuses</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ background: "#1e1b14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Restaurant", "Plan", "Status", "Trial ends", "Period end", "Created", ""].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={emptyCell}>Loading…</td></tr>
            ) : subs.length === 0 ? (
              <tr><td colSpan={7} style={emptyCell}>No subscriptions found</td></tr>
            ) : subs.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <td style={cellStyle}>
                  <div style={{ fontWeight: 600 }}>{s.restaurant?.name ?? "—"}</div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{s.restaurantId.slice(0, 8)}…</div>
                </td>
                <td style={cellStyle}>{s.plan?.name ?? "—"}</td>
                <td style={cellStyle}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "999px", background: `${STATUS_COLOR[s.status]}22`, color: STATUS_COLOR[s.status] }}>
                    {s.status}
                  </span>
                </td>
                <td style={{ ...cellStyle, fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)" }}>
                  {s.trialEndsAt ? new Date(s.trialEndsAt).toLocaleDateString() : "—"}
                </td>
                <td style={{ ...cellStyle, fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)" }}>
                  {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : "—"}
                </td>
                <td style={{ ...cellStyle, fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
                  {new Date(s.createdAt!).toLocaleDateString()}
                </td>
                <td style={{ ...cellStyle, textAlign: "right" }}>
                  <button onClick={() => setEditing(s)} style={btnGhost}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "flex-end" }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={btnGhost}>← Prev</button>
          <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", alignSelf: "center" }}>{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={btnGhost}>Next →</button>
        </div>
      )}

      {showNew && <NewSubModal plans={plans} onClose={() => setShowNew(false)} onCreated={load} />}
      {editing && <EditStatusModal sub={editing} onClose={() => setEditing(null)} onUpdated={load} />}
    </div>
  );
}

const inputStyle: React.CSSProperties = { background: "#18160f", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", color: "#e8e4dd", padding: "0.4rem 0.75rem", fontSize: "0.875rem", outline: "none", width: "100%" };
const labelStyle: React.CSSProperties = { fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "0.25rem" };
const thStyle: React.CSSProperties = { padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" };
const cellStyle: React.CSSProperties = { padding: "0.75rem 1rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.85)" };
const emptyCell: React.CSSProperties = { padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.3)" };
const btnPrimary: React.CSSProperties = { background: "#c4410c", color: "#fff", border: "none", borderRadius: "6px", padding: "0.4rem 0.875rem", fontSize: "0.875rem", cursor: "pointer", fontWeight: 600 };
const btnGhost: React.CSSProperties = { background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "5px", padding: "0.25rem 0.6rem", fontSize: "0.8125rem", cursor: "pointer" };
