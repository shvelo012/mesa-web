"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Subscription, Plan, Feature } from "@/types";

// ─── helpers ──────────────────────────────────────────────────────────────────

function cents(n: number) {
  return n === 0 ? "Free" : `$${(n / 100).toFixed(0)}/mo`;
}

function daysLeft(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

const STATUS_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  TRIALING:  { bg: "#fef3c7", color: "#b45309", label: "Trial" },
  ACTIVE:    { bg: "#dcfce7", color: "#15803d", label: "Active" },
  PAST_DUE:  { bg: "#fee2e2", color: "#dc2626", label: "Past due" },
  CANCELLED: { bg: "#f3f4f6", color: "#6b7280", label: "Cancelled" },
  EXPIRED:   { bg: "#f3f4f6", color: "#6b7280", label: "Expired" },
};

const PLAN_ACCENT: Record<string, string> = {
  free_trial: "#6b7280",
  pro:        "#2563eb",
  premium:    "#c4410c",
};

// ─── Fake payment modal ───────────────────────────────────────────────────────

function PaymentModal({
  plan,
  onClose,
  onSuccess,
}: {
  plan: Plan;
  onClose: () => void;
  onSuccess: (sub: Subscription) => void;
}) {
  const [form, setForm] = useState({ cardNumber: "", expiry: "", cvv: "", cardName: "" });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function fmt(key: keyof typeof form, raw: string) {
    if (key === "cardNumber") raw = raw.replace(/\D/g, "").slice(0, 16);
    if (key === "expiry") {
      raw = raw.replace(/\D/g, "").slice(0, 4);
      if (raw.length > 2) raw = raw.slice(0, 2) + "/" + raw.slice(2);
    }
    if (key === "cvv") raw = raw.replace(/\D/g, "").slice(0, 4);
    setForm((f) => ({ ...f, [key]: raw }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setProcessing(true);
    try {
      const { data } = await api.post("/plans/upgrade", {
        planId: plan.id,
        cardNumber: form.cardNumber,
        expiry: form.expiry,
        cvv: form.cvv,
        cardName: form.cardName,
      });
      setDone(true);
      setTimeout(() => onSuccess(data.subscription), 1200);
    } catch (ex: unknown) {
      const msg = (ex as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Payment failed. Check your card details.");
    } finally {
      setProcessing(false);
    }
  }

  const accent = PLAN_ACCENT[plan.slug] ?? "#c4410c";
  const complete = form.cardNumber.length === 16 && form.expiry.length === 5 && form.cvv.length >= 3 && form.cardName.length >= 2;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(24,22,15,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "2rem", width: "420px", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>✓</div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#18160f", marginBottom: "0.375rem" }}>Payment successful</h3>
            <p style={{ color: "#9a9088", fontSize: "0.9375rem" }}>Upgraded to <strong>{plan.name}</strong></p>
          </div>
        ) : (
          <>
            {/* Plan summary */}
            <div style={{ background: "#f9f7f4", borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "0.75rem", color: "#9a9088", marginBottom: "0.2rem" }}>Upgrading to</p>
                <p style={{ fontWeight: 700, color: "#18160f", fontSize: "1.0625rem" }}>{plan.name}</p>
                {plan.description && <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginTop: "0.15rem" }}>{plan.description}</p>}
              </div>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: accent }}>{cents(plan.priceMonthly)}</span>
            </div>

            <form onSubmit={submit}>
              {/* Card number */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>Card number</label>
                <div style={{ position: "relative" }}>
                  <input
                    value={form.cardNumber.replace(/(.{4})/g, "$1 ").trim()}
                    onChange={(e) => fmt("cardNumber", e.target.value.replace(/\s/g, ""))}
                    placeholder="1234 5678 9012 3456"
                    style={{ ...inputStyle, paddingRight: "2.5rem", letterSpacing: "0.08em" }}
                    required
                  />
                  <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }}>
                    {form.cardNumber.startsWith("4") ? "💳" : form.cardNumber.startsWith("5") ? "💳" : "💳"}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={labelStyle}>Expiry (MM/YY)</label>
                  <input value={form.expiry} onChange={(e) => fmt("expiry", e.target.value)} placeholder="12/27" style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>CVV</label>
                  <input value={form.cvv} onChange={(e) => fmt("cvv", e.target.value)} placeholder="123" type="password" style={inputStyle} required />
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={labelStyle}>Cardholder name</label>
                <input value={form.cardName} onChange={(e) => setForm((f) => ({ ...f, cardName: e.target.value }))} placeholder="Marco Rossi" style={inputStyle} required />
              </div>

              {error && (
                <div style={{ padding: "0.625rem 0.875rem", background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "7px", color: "#dc2626", fontSize: "0.8125rem", marginBottom: "1rem" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={processing || !complete}
                style={{
                  width: "100%", padding: "0.75rem", borderRadius: "8px", border: "none",
                  background: complete ? accent : "#e5e7eb",
                  color: complete ? "#fff" : "#9ca3af",
                  fontWeight: 700, fontSize: "1rem", cursor: complete ? "pointer" : "default",
                  transition: "all 0.2s",
                }}
              >
                {processing ? "Processing…" : `Pay ${cents(plan.priceMonthly)}`}
              </button>

              <button type="button" onClick={onClose} style={{ width: "100%", marginTop: "0.625rem", padding: "0.6rem", background: "transparent", border: "none", color: "#9a9088", fontSize: "0.875rem", cursor: "pointer" }}>
                Cancel
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#c8c2bc", marginTop: "1rem" }}>
              🔒 Simulated checkout — no real charge
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Plan comparison card ─────────────────────────────────────────────────────

function PlanCard({
  plan,
  current,
  onUpgrade,
}: {
  plan: Plan;
  current: boolean;
  onUpgrade: (plan: Plan) => void;
}) {
  const accent = PLAN_ACCENT[plan.slug] ?? "#c4410c";
  return (
    <div style={{
      border: `2px solid ${current ? accent : "rgba(24,22,15,0.1)"}`,
      borderRadius: "12px",
      padding: "1.5rem",
      background: current ? `${accent}08` : "#fff",
      position: "relative",
      transition: "border-color 0.15s",
    }}>
      {current && (
        <span style={{ position: "absolute", top: "-1px", right: "1rem", background: accent, color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "0 0 6px 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Current plan
        </span>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#18160f", margin: 0 }}>{plan.name}</h3>
        <span style={{ fontSize: "1.5rem", fontWeight: 800, color: accent }}>{cents(plan.priceMonthly)}</span>
      </div>
      {plan.description && <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginBottom: "1rem", lineHeight: 1.5 }}>{plan.description}</p>}
      {plan.trialDays && !current && (
        <p style={{ fontSize: "0.8125rem", color: "#b45309", fontWeight: 600, marginBottom: "0.75rem" }}>🕐 {plan.trialDays}-day free trial</p>
      )}

      {/* Feature list */}
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.25rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {(plan.features ?? []).map((f: Feature) => (
          <li key={f.id} style={{ fontSize: "0.8125rem", color: "#5c5248", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: accent, fontWeight: 700 }}>✓</span> {f.name}
          </li>
        ))}
      </ul>

      {current ? (
        <div style={{ padding: "0.5rem", textAlign: "center", borderRadius: "7px", background: `${accent}15`, color: accent, fontSize: "0.875rem", fontWeight: 600 }}>
          Active plan
        </div>
      ) : (
        <button
          onClick={() => onUpgrade(plan)}
          style={{
            width: "100%", padding: "0.625rem", borderRadius: "8px", border: "none",
            background: accent, color: "#fff", fontWeight: 700, fontSize: "0.9375rem",
            cursor: "pointer", transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {plan.priceMonthly === 0 ? "Start free trial" : `Upgrade to ${plan.name}`}
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { user, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState<Plan | null>(null);

  const load = useCallback(async () => {
    const [subRes, plansRes] = await Promise.all([
      api.get("/plans/my-subscription").catch(() => ({ data: null })),
      api.get("/plans"),
    ]);
    setSub(subRes.data);
    setPlans(plansRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user || (user.role !== "RESTAURANT_OWNER" && user.role !== "ADMIN")) {
      router.push("/login");
      return;
    }
    load();
  }, [_hasHydrated, user, router, load]);

  if (!_hasHydrated || loading) return null;

  const currentPlanId = sub?.planId ?? null;
  const statusInfo = sub ? (STATUS_COLOR[sub.status] ?? STATUS_COLOR.EXPIRED) : null;
  const trialLeft = sub?.status === "TRIALING" ? daysLeft(sub.trialEndsAt) : null;
  const periodLeft = sub?.status === "ACTIVE" ? daysLeft(sub.currentPeriodEnd) : null;

  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh" }}>
      {/* Nav */}
      <nav className="nav">
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/dashboard" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em", textDecoration: "none" }}>mesa</Link>
          <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
            <Link href="/manage-reservations" style={{ textDecoration: "none" }}><button className="btn btn-ghost btn-sm">Reservations</button></Link>
            <Link href="/menu" style={{ textDecoration: "none" }}><button className="btn btn-ghost btn-sm">Menu</button></Link>
            <Link href="/settings" style={{ textDecoration: "none" }}><button className="btn btn-ghost btn-sm">Settings</button></Link>
            <Link href="/billing" style={{ textDecoration: "none" }}><button className="btn btn-primary btn-sm">Billing</button></Link>
            <button className="btn btn-ghost btn-sm" onClick={() => { logout(); router.push("/"); }}>Sign out</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em", marginBottom: "2rem" }}>Billing & Plan</h1>

        {/* Current plan banner */}
        {sub && statusInfo && (
          <div className="card anim-1" style={{ opacity: 0, padding: "1.5rem 1.75rem", marginBottom: "2rem", display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#18160f", margin: 0 }}>
                  {sub.plan?.name ?? "—"}
                </h2>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "999px", background: statusInfo.bg, color: statusInfo.color }}>
                  {statusInfo.label}
                </span>
              </div>
              {trialLeft !== null && (
                <p style={{ fontSize: "0.875rem", color: "#b45309", margin: 0 }}>
                  {trialLeft > 0 ? `⏳ Trial ends in ${trialLeft} day${trialLeft !== 1 ? "s" : ""}` : "⚠️ Trial expired"}
                </p>
              )}
              {periodLeft !== null && (
                <p style={{ fontSize: "0.875rem", color: "#9a9088", margin: 0 }}>
                  Next billing in {periodLeft} day{periodLeft !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {(sub.plan?.features ?? []).map((f: Feature) => (
                <span key={f.id} style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "999px", background: "#fef2ec", color: "#c4410c", fontWeight: 500 }}>
                  {f.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {!sub && (
          <div className="card anim-1" style={{ opacity: 0, padding: "1.5rem 1.75rem", marginBottom: "2rem", borderLeft: "4px solid #f59e0b" }}>
            <p style={{ fontWeight: 600, color: "#18160f", marginBottom: "0.25rem" }}>No active subscription</p>
            <p style={{ fontSize: "0.875rem", color: "#9a9088", margin: 0 }}>Choose a plan below to get started.</p>
          </div>
        )}

        {/* Plan comparison */}
        <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#18160f", marginBottom: "1rem" }}>Available Plans</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              current={p.id === currentPlanId}
              onUpgrade={setUpgradingPlan}
            />
          ))}
        </div>

        <p style={{ marginTop: "2rem", fontSize: "0.8125rem", color: "#c8c2bc", textAlign: "center" }}>
          🔒 This is a simulated billing system. No real charges are made.
        </p>
      </div>

      {upgradingPlan && (
        <PaymentModal
          plan={upgradingPlan}
          onClose={() => setUpgradingPlan(null)}
          onSuccess={(newSub) => {
            setSub(newSub);
            setUpgradingPlan(null);
          }}
        />
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.5rem 0.75rem", borderRadius: "7px",
  border: "1.5px solid rgba(24,22,15,0.12)", background: "#fafaf9",
  fontSize: "0.9375rem", color: "#18160f", outline: "none",
  boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: "0.8125rem", fontWeight: 500, color: "#5c5248", display: "block", marginBottom: "0.35rem",
};
