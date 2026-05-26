"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { RestaurantStaff, StaffRole, Permission } from "@/types";
import { useTranslation } from "react-i18next";

const DEFAULT_ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  MANAGER: ["RESERVATIONS_READ", "RESERVATIONS_WRITE", "FLOOR_PLAN", "MENU_MANAGE", "SETTINGS_READ", "SETTINGS_WRITE", "REPORTS"],
  HOST: ["RESERVATIONS_READ", "RESERVATIONS_WRITE", "SETTINGS_READ"],
  WAITER: ["RESERVATIONS_READ", "RESERVATIONS_WRITE"],
  CHEF: ["RESERVATIONS_READ", "REPORTS"],
  CUSTOM: [],
};

const ALL_ROLES: StaffRole[] = ["MANAGER", "HOST", "WAITER", "CHEF", "CUSTOM"];
const ALL_PERMISSIONS: Permission[] = ["RESERVATIONS_READ", "RESERVATIONS_WRITE", "FLOOR_PLAN", "MENU_MANAGE", "SETTINGS_READ", "SETTINGS_WRITE", "STAFF_MANAGE", "REPORTS"];

export default function StaffPage() {
  const { t } = useTranslation();
  const { user, _hasHydrated, can } = useAuthStore();
  const router = useRouter();
  const [staff, setStaff] = useState<RestaurantStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffRole>("WAITER");
  const [inviteCustomPerms, setInviteCustomPerms] = useState<Permission[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Edit modal
  const [editStaff, setEditStaff] = useState<RestaurantStaff | null>(null);
  const [editRole, setEditRole] = useState<StaffRole>("WAITER");
  const [editPerms, setEditPerms] = useState<Permission[]>([]);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push("/login"); return; }
    if (!can("STAFF_MANAGE")) { router.push("/dashboard"); return; }
    fetchStaff();
  }, [user, _hasHydrated]); // eslint-disable-line

  async function fetchStaff() {
    try {
      const { data } = await api.get<RestaurantStaff[]>("/restaurants/me/staff");
      setStaff(data);
    } catch {
      setError(t("staff.failedLoad"));
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setError("");
    try {
      const perms = inviteRole === "CUSTOM" ? inviteCustomPerms : DEFAULT_ROLE_PERMISSIONS[inviteRole];
      await api.post("/restaurants/me/staff", {
        email: inviteEmail,
        name: inviteName,
        role: inviteRole,
        permissions: perms,
      });
      setShowInvite(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("WAITER");
      setInviteCustomPerms([]);
      fetchStaff();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(typeof msg === "string" ? msg : t("staff.failedInvite"));
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editStaff) return;
    setEditLoading(true);
    setError("");
    try {
      const perms = editRole === "CUSTOM" ? editPerms : DEFAULT_ROLE_PERMISSIONS[editRole];
      await api.patch(`/restaurants/me/staff/${editStaff.id}`, {
        role: editRole,
        permissions: perms,
      });
      setEditStaff(null);
      fetchStaff();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(typeof msg === "string" ? msg : t("staff.failedUpdate"));
    } finally {
      setEditLoading(false);
    }
  }

  async function handleRemove(id: string, name: string) {
    if (!window.confirm(t("staff.confirmRemove", { name }))) return;
    try {
      await api.delete(`/restaurants/me/staff/${id}`);
      fetchStaff();
    } catch {
      setError(t("staff.failedRemove"));
    }
  }

  function togglePerm(list: Permission[], perm: Permission, setter: (p: Permission[]) => void) {
    setter(list.includes(perm) ? list.filter((p) => p !== perm) : [...list, perm]);
  }

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
            {t("nav.backToDashboard")}
          </Link>
          <div style={{ width: "1px", height: "16px", background: "rgba(24,22,15,0.1)" }} />
          <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>mesa</span>
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div className="anim-1" style={{ opacity: 0, marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.625rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>{t("staff.title")}</h1>
            <p style={{ fontSize: "0.875rem", color: "#9a9088", marginTop: "0.2rem" }}>
              {t("staff.members", { count: staff.length })} · {t("staff.inviteManage")}
            </p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="btn btn-primary btn-md"
          >
            {t("staff.invite")}
          </button>
        </div>

        {error && (
          <div style={{ padding: "0.75rem 1rem", background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <div className="anim-2 card" style={{ opacity: 0, overflow: "hidden" }}>
          {staff.length === 0 ? (
            <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
              <p style={{ fontSize: "1rem", fontWeight: 600, color: "#18160f", marginBottom: "0.5rem" }}>{t("staff.noStaff")}</p>
              <p style={{ fontSize: "0.875rem", color: "#9a9088" }}>{t("staff.noStaffSub")}</p>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 120px 100px 140px", gap: "1rem", padding: "0.625rem 1.5rem", background: "#fafaf8", borderBottom: "1px solid rgba(24,22,15,0.07)", alignItems: "center" }}>
                {(["name", "email", "role", "status", "actions"] as const).map((h) => (
                  <span key={h} style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t(`staff.headers.${h}`)}</span>
                ))}
              </div>
              {staff.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr 120px 100px 140px",
                    gap: "1rem",
                    padding: "1rem 1.5rem",
                    borderTop: i === 0 ? "none" : "1px solid rgba(24,22,15,0.06)",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#18160f" }}>{s.name}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "0.8125rem", color: "#5c5248" }}>{s.email}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, background: "#f0ede8", color: "#5c5248", padding: "0.2rem 0.5rem", borderRadius: "999px" }}>
                      {t(`staff.roles.${s.role}`)}
                    </span>
                  </div>
                  <div>
                    {s.activationPending ? (
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#b45309", background: "#fffbeb", padding: "0.2rem 0.5rem", borderRadius: "999px" }}>{t("staff.status.pending")}</span>
                    ) : s.isActive ? (
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#16a34a", background: "#f0fdf4", padding: "0.2rem 0.5rem", borderRadius: "999px" }}>{t("staff.status.active")}</span>
                    ) : (
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9a9088", background: "#f5f3ef", padding: "0.2rem 0.5rem", borderRadius: "999px" }}>{t("staff.status.inactive")}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.375rem" }}>
                    <button
                      onClick={() => { setEditStaff(s); setEditRole(s.role); setEditPerms(s.permissions); }}
                      style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", fontWeight: 600, fontFamily: "inherit", border: "1px solid rgba(24,22,15,0.1)", borderRadius: "6px", cursor: "pointer", background: "#fafaf8", color: "#5c5248" }}
                    >
                      {t("staff.edit")}
                    </button>
                    <button
                      onClick={() => handleRemove(s.id, s.name || "")}
                      style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", fontWeight: 600, fontFamily: "inherit", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "6px", cursor: "pointer", background: "#fef2f2", color: "#dc2626" }}
                    >
                      {t("staff.remove")}
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowInvite(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "12px", width: "100%", maxWidth: "480px", maxHeight: "80vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.22)", animation: "slideUp 0.2s ease" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(24,22,15,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#18160f" }}>{t("staff.inviteModal.title")}</h3>
              <button onClick={() => setShowInvite(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9088", fontSize: "1.375rem", lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleInvite} style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">{t("staff.inviteModal.emailLabel")} <span style={{ color: "#c4410c" }}>*</span></label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="input" placeholder={t("staff.inviteModal.emailPlaceholder")} required />
              </div>
              <div>
                <label className="label">{t("staff.inviteModal.nameLabel")} <span style={{ color: "#c4410c" }}>*</span></label>
                <input type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)} className="input" placeholder={t("staff.inviteModal.namePlaceholder")} required />
              </div>
              <div>
                <label className="label">{t("staff.inviteModal.roleLabel")}</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as StaffRole)} className="input">
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>{t(`staff.roles.${r}`)}</option>
                  ))}
                </select>
              </div>
              {inviteRole === "CUSTOM" && (
                <div>
                  <label className="label">{t("staff.inviteModal.permissionsLabel")}</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {ALL_PERMISSIONS.map((p) => (
                      <label key={p} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "#5c5248", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={inviteCustomPerms.includes(p)}
                          onChange={() => togglePerm(inviteCustomPerms, p, setInviteCustomPerms)}
                        />
                        {t(`staff.permissions.${p}`)}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: "0.625rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowInvite(false)} className="btn btn-ghost btn-md" style={{ flex: 1 }}>{t("staff.inviteModal.cancel")}</button>
                <button type="submit" disabled={inviteLoading} className="btn btn-primary btn-md" style={{ flex: 2, opacity: inviteLoading ? 0.65 : 1 }}>
                  {inviteLoading ? t("staff.inviteModal.inviting") : t("staff.inviteModal.send")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editStaff && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setEditStaff(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "12px", width: "100%", maxWidth: "480px", maxHeight: "80vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.22)", animation: "slideUp 0.2s ease" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(24,22,15,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#18160f" }}>{t("staff.editModal.title", { name: editStaff.name })}</h3>
              <button onClick={() => setEditStaff(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9088", fontSize: "1.375rem", lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleUpdate} style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">{t("staff.editModal.roleLabel")}</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value as StaffRole)} className="input">
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>{t(`staff.roles.${r}`)}</option>
                  ))}
                </select>
              </div>
              {editRole === "CUSTOM" && (
                <div>
                  <label className="label">{t("staff.editModal.permissionsLabel")}</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {ALL_PERMISSIONS.map((p) => (
                      <label key={p} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "#5c5248", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={editPerms.includes(p)}
                          onChange={() => togglePerm(editPerms, p, setEditPerms)}
                        />
                        {t(`staff.permissions.${p}`)}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: "0.625rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setEditStaff(null)} className="btn btn-ghost btn-md" style={{ flex: 1 }}>{t("staff.editModal.cancel")}</button>
                <button type="submit" disabled={editLoading} className="btn btn-primary btn-md" style={{ flex: 2, opacity: editLoading ? 0.65 : 1 }}>
                  {editLoading ? t("staff.editModal.saving") : t("staff.editModal.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
