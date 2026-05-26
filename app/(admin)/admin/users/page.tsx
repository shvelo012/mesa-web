"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { User, Role } from "@/types";

const ROLES: Role[] = ["USER", "RESTAURANT_OWNER", "ADMIN"];
const ROLE_COLOR: Record<string, string> = {
  USER: "#6b7280",
  RESTAURANT_OWNER: "#f59e0b",
  ADMIN: "#c4410c",
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>("USER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get("/admin/users", { params });
      setUsers(data.users);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  async function saveRole(userId: string) {
    setSaving(true);
    setError("");
    try {
      await api.patch(`/admin/users/${userId}`, { role: editRole });
      setEditingId(null);
      load();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Delete user "${name}"? This is permanent.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      load();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed");
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "#fff" }}>Users <span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>({total})</span></h1>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name or email…"
          style={inputStyle}
        />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} style={inputStyle}>
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: "0.75rem", fontSize: "0.875rem" }}>{error}</p>}

      <div style={{ background: "#1e1b14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Name", "Email", "Role", "Verified", "Joined", ""].map((h) => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <td style={cellStyle}>{u.name}</td>
                <td style={{ ...cellStyle, color: "rgba(255,255,255,0.55)", fontSize: "0.8125rem" }}>{u.email}</td>
                <td style={cellStyle}>
                  {editingId === u.id ? (
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <select value={editRole} onChange={(e) => setEditRole(e.target.value as Role)} style={{ ...inputStyle, padding: "0.25rem 0.5rem", fontSize: "0.8125rem" }}>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <button onClick={() => saveRole(u.id)} disabled={saving} style={btnPrimary}>{saving ? "…" : "Save"}</button>
                      <button onClick={() => setEditingId(null)} style={btnGhost}>✕</button>
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "999px", background: `${ROLE_COLOR[u.role]}22`, color: ROLE_COLOR[u.role] }}>{u.role}</span>
                  )}
                </td>
                <td style={cellStyle}>
                  <span style={{ fontSize: "0.75rem", color: u.emailVerified ? "#22c55e" : "#f59e0b" }}>
                    {u.emailVerified ? "✓" : "Pending"}
                  </span>
                </td>
                <td style={{ ...cellStyle, color: "rgba(255,255,255,0.4)", fontSize: "0.8125rem" }}>
                  {new Date((u as unknown as { createdAt: string }).createdAt).toLocaleDateString()}
                </td>
                <td style={{ ...cellStyle, textAlign: "right" }}>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button onClick={() => { setEditingId(u.id); setEditRole(u.role); }} style={btnGhost}>Edit role</button>
                    <button onClick={() => deleteUser(u.id, u.name)} style={{ ...btnGhost, color: "#ef4444" }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "flex-end" }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={btnGhost}>← Prev</button>
          <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", alignSelf: "center" }}>{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={btnGhost}>Next →</button>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#18160f",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "6px",
  color: "#e8e4dd",
  padding: "0.4rem 0.75rem",
  fontSize: "0.875rem",
  outline: "none",
};
const cellStyle: React.CSSProperties = { padding: "0.75rem 1rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.85)" };
const btnPrimary: React.CSSProperties = { background: "#c4410c", color: "#fff", border: "none", borderRadius: "5px", padding: "0.25rem 0.6rem", fontSize: "0.8125rem", cursor: "pointer", fontWeight: 600 };
const btnGhost: React.CSSProperties = { background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "5px", padding: "0.25rem 0.6rem", fontSize: "0.8125rem", cursor: "pointer" };
