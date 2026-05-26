"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Restaurant, Subscription, RestaurantFeatureGrant } from "@/types";

interface AdminRestaurant extends Restaurant {
  owner?: { id: string; name: string; email: string };
  subscriptions?: Subscription[];
}

const STATUS_COLOR: Record<string, string> = {
  TRIALING: "#f59e0b",
  ACTIVE: "#22c55e",
  PAST_DUE: "#ef4444",
  CANCELLED: "#6b7280",
  EXPIRED: "#6b7280",
};

// ─── Feature panel (per restaurant) ─────────────────────────────────────────

function FeaturePanel({ restaurant, onClose }: { restaurant: AdminRestaurant; onClose: () => void }) {
  const [features, setFeatures] = useState<RestaurantFeatureGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/restaurants/${restaurant.id}/features`);
      setFeatures(data);
    } finally {
      setLoading(false);
    }
  }, [restaurant.id]);

  useEffect(() => { load(); }, [load]);

  async function toggle(featureId: string) {
    setToggling(featureId);
    try {
      const { data } = await api.post(`/admin/restaurants/${restaurant.id}/features/${featureId}/toggle`);
      setFeatures((prev) =>
        prev.map((f) =>
          f.id === featureId ? { ...f, enabled: data.enabled, grantedAt: data.enabled ? new Date().toISOString() : null } : f
        )
      );
    } finally {
      setToggling(null);
    }
  }

  const granted = features.filter((f) => f.enabled);
  const available = features.filter((f) => !f.enabled);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div style={{ background: "#1e1b14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "1.75rem", width: "520px", maxHeight: "80vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>{restaurant.name}</h3>
            <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.35)", marginTop: "0.2rem" }}>Direct feature grants — override plan access</p>
          </div>
          <button onClick={onClose} style={btnGhost}>✕</button>
        </div>

        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>Loading…</p>
        ) : features.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>No features defined yet. Create feature flags in Plans & Features first.</p>
        ) : (
          <>
            {/* Granted */}
            {granted.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <p style={sectionLabel}>Granted ({granted.length})</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {granted.map((f) => (
                    <FeatureRow key={f.id} feature={f} toggling={toggling} onToggle={toggle} />
                  ))}
                </div>
              </div>
            )}

            {/* Available to grant */}
            {available.length > 0 && (
              <div>
                <p style={sectionLabel}>Not granted ({available.length})</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {available.map((f) => (
                    <FeatureRow key={f.id} feature={f} toggling={toggling} onToggle={toggle} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FeatureRow({
  feature,
  toggling,
  onToggle,
}: {
  feature: RestaurantFeatureGrant;
  toggling: string | null;
  onToggle: (id: string) => void;
}) {
  const isToggling = toggling === feature.id;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.5rem 0.75rem",
      borderRadius: "7px",
      background: feature.enabled ? "rgba(34,197,94,0.07)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${feature.enabled ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)"}`,
    }}>
      <div>
        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: feature.enabled ? "#86efac" : "rgba(255,255,255,0.7)" }}>
          {feature.name}
        </span>
        <code style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", marginLeft: "0.5rem" }}>{feature.key}</code>
        {feature.enabled && feature.grantedAt && (
          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", marginLeft: "0.5rem" }}>
            granted {new Date(feature.grantedAt).toLocaleDateString()}
          </span>
        )}
      </div>
      <button
        onClick={() => onToggle(feature.id)}
        disabled={isToggling}
        style={{
          fontSize: "0.8125rem",
          padding: "0.2rem 0.7rem",
          borderRadius: "5px",
          border: `1px solid ${feature.enabled ? "rgba(239,68,68,0.4)" : "rgba(34,197,94,0.4)"}`,
          background: "transparent",
          color: feature.enabled ? "#fca5a5" : "#86efac",
          cursor: isToggling ? "wait" : "pointer",
          opacity: isToggling ? 0.5 : 1,
          whiteSpace: "nowrap",
        }}
      >
        {isToggling ? "…" : feature.enabled ? "Revoke" : "Grant"}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminRestaurant | null>(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
      if (search) params.search = search;
      const { data } = await api.get("/admin/restaurants", { params });
      setRestaurants(data.restaurants);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "#fff" }}>
        Restaurants <span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>({total})</span>
      </h1>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name or email…"
          style={inputStyle}
        />
      </div>

      <div style={{ background: "#1e1b14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Restaurant", "Owner", "Plan", "Status", "Created", ""].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={emptyCell}>Loading…</td></tr>
            ) : restaurants.length === 0 ? (
              <tr><td colSpan={6} style={emptyCell}>No restaurants found</td></tr>
            ) : restaurants.map((r) => {
              const activeSub = r.subscriptions?.find((s) =>
                s.status === "TRIALING" || s.status === "ACTIVE"
              ) ?? r.subscriptions?.[0];
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>{r.slug}</div>
                  </td>
                  <td style={{ ...cellStyle, fontSize: "0.8125rem" }}>
                    <div>{r.owner?.name}</div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>{r.owner?.email}</div>
                  </td>
                  <td style={cellStyle}>
                    {activeSub?.plan ? (
                      <span style={{ fontSize: "0.8125rem", color: "#e8e4dd" }}>{activeSub.plan.name}</span>
                    ) : (
                      <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.25)" }}>—</span>
                    )}
                  </td>
                  <td style={cellStyle}>
                    {activeSub ? (
                      <span style={{
                        fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "999px",
                        background: `${STATUS_COLOR[activeSub.status]}22`, color: STATUS_COLOR[activeSub.status],
                      }}>{activeSub.status}</span>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.25)" }}>No sub</span>
                    )}
                  </td>
                  <td style={{ ...cellStyle, color: "rgba(255,255,255,0.4)", fontSize: "0.8125rem" }}>
                    {new Date((r as unknown as { createdAt: string }).createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    <button
                      onClick={() => setSelected(r)}
                      style={{ ...btnGhost, color: "#f97316", borderColor: "rgba(249,115,22,0.3)" }}
                    >
                      Feature flags
                    </button>
                  </td>
                </tr>
              );
            })}
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

      {selected && <FeaturePanel restaurant={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const inputStyle: React.CSSProperties = { background: "#18160f", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", color: "#e8e4dd", padding: "0.4rem 0.75rem", fontSize: "0.875rem", outline: "none" };
const thStyle: React.CSSProperties = { padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" };
const cellStyle: React.CSSProperties = { padding: "0.75rem 1rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.85)" };
const emptyCell: React.CSSProperties = { padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.3)" };
const btnGhost: React.CSSProperties = { background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "5px", padding: "0.25rem 0.6rem", fontSize: "0.8125rem", cursor: "pointer" };
const sectionLabel: React.CSSProperties = { fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.4rem" };
