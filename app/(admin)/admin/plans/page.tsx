"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Plan, Feature } from "@/types";

// ─── helpers ──────────────────────────────────────────────────────────────────

function cents(n: number) {
  return n === 0 ? "Free" : `$${(n / 100).toFixed(2)}/mo`;
}

// ─── Feature Form ─────────────────────────────────────────────────────────────

function FeatureForm({ onCreated }: { onCreated: () => void }) {
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      await api.post("/admin/features", { key, name, description: desc });
      setKey(""); setName(""); setDesc("");
      onCreated();
    } catch (ex: unknown) {
      setErr((ex as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed");
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "flex-end" }}>
      <div>
        <label style={labelStyle}>Key (snake_case)</label>
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g. staff_management" required style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Display name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Staff Management" required style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional" style={{ ...inputStyle, width: "200px" }} />
      </div>
      <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "…" : "+ Add Feature"}</button>
      {err && <span style={{ color: "#ef4444", fontSize: "0.8125rem" }}>{err}</span>}
    </form>
  );
}

// ─── Plan Form ────────────────────────────────────────────────────────────────

function PlanForm({ allFeatures, onCreated }: { allFeatures: Feature[]; onCreated: () => void }) {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("0");
  const [trial, setTrial] = useState("");
  const [sort, setSort] = useState("0");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function toggleFeature(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      await api.post("/admin/plans", {
        slug, name, description: desc,
        priceMonthly: Math.round(parseFloat(price) * 100),
        trialDays: trial ? parseInt(trial) : null,
        sortOrder: parseInt(sort),
        featureIds: Array.from(selected),
      });
      setSlug(""); setName(""); setDesc(""); setPrice("0"); setTrial(""); setSort("0"); setSelected(new Set());
      onCreated();
    } catch (ex: unknown) {
      setErr((ex as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed");
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} style={{ background: "#18160f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "1.25rem" }}>
      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "1rem" }}>New Plan</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <div>
          <label style={labelStyle}>Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="pro" required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pro" required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Price (USD)</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.01" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Trial days</label>
          <input value={trial} onChange={(e) => setTrial(e.target.value)} type="number" min="0" placeholder="14" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Sort order</label>
          <input value={sort} onChange={(e) => setSort(e.target.value)} type="number" style={inputStyle} />
        </div>
      </div>
      <div style={{ marginBottom: "0.75rem" }}>
        <label style={labelStyle}>Description</label>
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional" style={{ ...inputStyle, width: "100%" }} />
      </div>

      {/* Feature checkboxes */}
      {allFeatures.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Features included</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.35rem" }}>
            {allFeatures.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => toggleFeature(f.id)}
                style={{
                  fontSize: "0.8125rem",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "999px",
                  border: `1px solid ${selected.has(f.id) ? "#c4410c" : "rgba(255,255,255,0.15)"}`,
                  background: selected.has(f.id) ? "rgba(196,65,12,0.2)" : "transparent",
                  color: selected.has(f.id) ? "#f97316" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                }}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "…" : "Create Plan"}</button>
        {err && <span style={{ color: "#ef4444", fontSize: "0.8125rem" }}>{err}</span>}
      </div>
    </form>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, allFeatures, onUpdated }: { plan: Plan; allFeatures: Feature[]; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(plan.name);
  const [desc, setDesc] = useState(plan.description ?? "");
  const [price, setPrice] = useState(String(plan.priceMonthly / 100));
  const [trial, setTrial] = useState(plan.trialDays != null ? String(plan.trialDays) : "");
  const [isActive, setIsActive] = useState(plan.isActive);
  const [sort, setSort] = useState(String(plan.sortOrder));
  const [features, setFeatures] = useState<Set<string>>(new Set(plan.features?.map((f) => f.id) ?? []));
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      await api.patch(`/admin/plans/${plan.id}`, {
        name, description: desc,
        priceMonthly: Math.round(parseFloat(price) * 100),
        trialDays: trial ? parseInt(trial) : null,
        isActive,
        sortOrder: parseInt(sort),
      });
      await api.put(`/admin/plans/${plan.id}/features`, { featureIds: Array.from(features) });
      setEditing(false);
      onUpdated();
    } catch (ex: unknown) {
      setErr((ex as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed");
    } finally { setSaving(false); }
  }

  async function toggleFeature(featureId: string) {
    setToggling(featureId);
    try {
      const { data } = await api.post(`/admin/plans/${plan.id}/features/${featureId}/toggle`);
      setFeatures((prev) => {
        const next = new Set(prev);
        data.enabled ? next.add(featureId) : next.delete(featureId);
        return next;
      });
      onUpdated();
    } finally { setToggling(null); }
  }

  async function deletePlan() {
    if (!confirm(`Delete plan "${plan.name}"?`)) return;
    try {
      await api.delete(`/admin/plans/${plan.id}`);
      onUpdated();
    } catch (ex: unknown) {
      alert((ex as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed");
    }
  }

  return (
    <div style={{ background: "#1e1b14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div>
          {editing ? (
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }} />
          ) : (
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>{plan.name}</h3>
          )}
          <code style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>{plan.slug}</code>
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {editing ? (
            <>
              <button onClick={save} disabled={saving} style={btnPrimary}>{saving ? "…" : "Save"}</button>
              <button onClick={() => setEditing(false)} style={btnGhost}>Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} style={btnGhost}>Edit</button>
              <button onClick={deletePlan} style={{ ...btnGhost, color: "#ef4444" }}>Delete</button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.6rem", marginBottom: "0.75rem" }}>
          <div><label style={labelStyle}>Price (USD)</label><input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.01" style={inputStyle} /></div>
          <div><label style={labelStyle}>Trial days</label><input value={trial} onChange={(e) => setTrial(e.target.value)} type="number" placeholder="none" style={inputStyle} /></div>
          <div><label style={labelStyle}>Sort</label><input value={sort} onChange={(e) => setSort(e.target.value)} type="number" style={inputStyle} /></div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active
            </label>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Description</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
          </div>
        </div>
      )}

      {!editing && (
        <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem", fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)" }}>
          <span style={{ color: plan.priceMonthly === 0 ? "#22c55e" : "#f97316", fontWeight: 700 }}>{cents(plan.priceMonthly)}</span>
          {plan.trialDays && <span>🕐 {plan.trialDays}-day trial</span>}
          <span style={{ color: plan.isActive ? "#22c55e" : "#6b7280" }}>{plan.isActive ? "Active" : "Inactive"}</span>
          {plan.description && <span style={{ color: "rgba(255,255,255,0.35)" }}>{plan.description}</span>}
        </div>
      )}

      {err && <p style={{ color: "#ef4444", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>{err}</p>}

      {/* Feature toggles */}
      <div>
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Features</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {allFeatures.map((f) => {
            const enabled = features.has(f.id);
            const isToggling = toggling === f.id;
            return (
              <button
                key={f.id}
                onClick={() => toggleFeature(f.id)}
                disabled={isToggling}
                title={f.description ?? f.key}
                style={{
                  fontSize: "0.8125rem",
                  padding: "0.2rem 0.7rem",
                  borderRadius: "999px",
                  border: `1px solid ${enabled ? "#c4410c" : "rgba(255,255,255,0.12)"}`,
                  background: enabled ? "rgba(196,65,12,0.2)" : "transparent",
                  color: enabled ? "#f97316" : "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  opacity: isToggling ? 0.5 : 1,
                  transition: "all 0.15s",
                }}
              >
                {enabled ? "✓ " : ""}{f.name}
              </button>
            );
          })}
          {allFeatures.length === 0 && <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.25)" }}>No features yet — create some above</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [featureEditName, setFeatureEditName] = useState("");
  const [featureEditDesc, setFeatureEditDesc] = useState("");
  const [featureSaving, setFeatureSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, featuresRes] = await Promise.all([
        api.get("/admin/plans"),
        api.get("/admin/features"),
      ]);
      setPlans(plansRes.data);
      setFeatures(featuresRes.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveFeatureEdit() {
    if (!editingFeature) return;
    setFeatureSaving(true);
    try {
      await api.patch(`/admin/features/${editingFeature.id}`, { name: featureEditName, description: featureEditDesc });
      setEditingFeature(null);
      load();
    } finally { setFeatureSaving(false); }
  }

  async function deleteFeature(f: Feature) {
    if (!confirm(`Delete feature "${f.name}"? It will be removed from all plans.`)) return;
    await api.delete(`/admin/features/${f.id}`);
    load();
  }

  if (loading) return <p style={{ color: "rgba(255,255,255,0.4)" }}>Loading…</p>;

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "2rem", color: "#fff" }}>Plans & Features</h1>

      {/* Features section */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Feature Flags</h2>
        <FeatureForm onCreated={load} />

        {features.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
            {features.map((f) => (
              <div key={f.id} style={{
                background: "#1e1b14",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "0.5rem 0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}>
                {editingFeature?.id === f.id ? (
                  <>
                    <input value={featureEditName} onChange={(e) => setFeatureEditName(e.target.value)} style={{ ...inputStyle, width: "120px" }} />
                    <input value={featureEditDesc} onChange={(e) => setFeatureEditDesc(e.target.value)} placeholder="desc" style={{ ...inputStyle, width: "140px" }} />
                    <button onClick={saveFeatureEdit} disabled={featureSaving} style={btnPrimary}>{featureSaving ? "…" : "Save"}</button>
                    <button onClick={() => setEditingFeature(null)} style={btnGhost}>✕</button>
                  </>
                ) : (
                  <>
                    <div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: f.isActive ? "#e8e4dd" : "rgba(255,255,255,0.3)" }}>{f.name}</span>
                      <code style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", marginLeft: "0.5rem" }}>{f.key}</code>
                    </div>
                    <button onClick={() => { setEditingFeature(f); setFeatureEditName(f.name); setFeatureEditDesc(f.description ?? ""); }} style={btnGhost}>Edit</button>
                    <button onClick={() => deleteFeature(f)} style={{ ...btnGhost, color: "#ef4444" }}>✕</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Plans section */}
      <section>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Plans</h2>
        <div style={{ marginBottom: "1.25rem" }}>
          <PlanForm allFeatures={features} onCreated={load} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem" }}>
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} allFeatures={features} onUpdated={load} />
          ))}
          {plans.length === 0 && (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>No plans yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

const inputStyle: React.CSSProperties = { background: "#0f0e0b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", color: "#e8e4dd", padding: "0.4rem 0.75rem", fontSize: "0.875rem", outline: "none", width: "100%" };
const labelStyle: React.CSSProperties = { fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "0.25rem" };
const btnPrimary: React.CSSProperties = { background: "#c4410c", color: "#fff", border: "none", borderRadius: "6px", padding: "0.4rem 0.875rem", fontSize: "0.875rem", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" };
const btnGhost: React.CSSProperties = { background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "5px", padding: "0.25rem 0.6rem", fontSize: "0.8125rem", cursor: "pointer" };
