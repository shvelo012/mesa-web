"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Restaurant, Floor } from "@/types";

const SECTION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  INDOOR:  { label: "Indoor",  color: "#2563eb", bg: "#eff6ff" },
  OUTDOOR: { label: "Outdoor", color: "#16a34a", bg: "#f0fdf4" },
  BAR:     { label: "Bar",     color: "#c4410c", bg: "#fef2ec" },
  PRIVATE: { label: "Private", color: "#7c3aed", bg: "#f5f3ff" },
};

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
  table?: { label: string };
};

type RestaurantFormData = {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  cuisine: string;
  openTime: string;
  closeTime: string;
};

type ReservationTab = "ALL" | "PENDING" | "CONFIRMED" | "PAST";

export default function DashboardPage() {
  const { user, logout, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [newFloorName, setNewFloorName] = useState("");
  const [newFloorType, setNewFloorType] = useState("INDOOR");
  const [newFloorWidth, setNewFloorWidth] = useState(800);
  const [newFloorHeight, setNewFloorHeight] = useState(600);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [resTab, setResTab] = useState<ReservationTab>("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isEditingRestaurant, setIsEditingRestaurant] = useState(false);
  const [editForm, setEditForm] = useState<RestaurantFormData>({ name: "", description: "", address: "", phone: "", email: "", cuisine: "", openTime: "09:00", closeTime: "22:00" });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deletingFloor, setDeletingFloor] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    try {
      const { data } = await api.get("/reservations/restaurant");
      setReservations(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user || user.role !== "RESTAURANT_OWNER") { router.push("/login"); return; }
    Promise.all([
      api.get("/restaurants/me").then(({ data }) => setRestaurant(data)),
      fetchReservations(),
    ]).finally(() => setLoading(false));
  }, [user, _hasHydrated, fetchReservations]);

  async function addFloor() {
    if (!newFloorName.trim()) return;
    const { data } = await api.post("/floors", {
      name: newFloorName,
      sectionType: newFloorType,
      width: newFloorWidth,
      height: newFloorHeight,
    });
    setRestaurant((r) => r ? { ...r, floors: [...(r.floors || []), data] } : r);
    setNewFloorName("");
  }

  async function handleDeleteFloor(floorId: string, floorName: string) {
    if (!window.confirm(`Delete "${floorName}"? All tables and walls will be permanently removed.`)) return;
    setDeletingFloor(floorId);
    try {
      await api.delete(`/floors/${floorId}`);
      setRestaurant((r) => r ? { ...r, floors: (r.floors || []).filter((f) => f.id !== floorId) } : r);
    } catch {
      alert("Failed to delete floor section.");
    } finally {
      setDeletingFloor(null);
    }
  }

  function openEditRestaurant() {
    if (!restaurant) return;
    setEditForm({
      name: restaurant.name,
      description: restaurant.description || "",
      address: restaurant.address,
      phone: restaurant.phone,
      email: restaurant.email,
      cuisine: restaurant.cuisine || "",
      openTime: restaurant.openTime,
      closeTime: restaurant.closeTime,
    });
    setEditError("");
    setIsEditingRestaurant(true);
  }

  async function handleEditRestaurant(e: React.FormEvent) {
    e.preventDefault();
    setEditSaving(true);
    setEditError("");
    try {
      const { data } = await api.put("/restaurants/me", editForm);
      setRestaurant((r) => r ? { ...r, ...data } : r);
      setIsEditingRestaurant(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setEditError(typeof msg === "string" ? msg : "Failed to save changes");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    setActionLoading(id + status);
    try {
      const { data } = await api.patch(`/reservations/${id}/status`, { status });
      setReservations((rs) => rs.map((r) => r.id === id ? { ...r, status: data.status } : r));
    } catch {
      alert("Failed to update reservation.");
    } finally {
      setActionLoading(null);
    }
  }

  const setEdit = (k: keyof RestaurantFormData, v: string) => setEditForm((f) => ({ ...f, [k]: v }));

  const today = new Date().toISOString().split("T")[0];

  const filteredReservations = reservations.filter((r) => {
    if (resTab === "PENDING") return r.status === "PENDING";
    if (resTab === "CONFIRMED") return r.status === "CONFIRMED";
    if (resTab === "PAST") return r.date < today || ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(r.status);
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

      {/* Edit restaurant modal */}
      {isEditingRestaurant && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsEditingRestaurant(false); }}
        >
          <div style={{ background: "#ffffff", borderRadius: "12px", padding: "2rem", width: "100%", maxWidth: "560px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#18160f" }}>Edit restaurant</h2>
              <button onClick={() => setIsEditingRestaurant(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9088", fontSize: "1.25rem", lineHeight: 1, fontFamily: "inherit" }}>×</button>
            </div>
            {editError && (
              <div style={{ padding: "0.75rem 1rem", background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                {editError}
              </div>
            )}
            <form onSubmit={handleEditRestaurant} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label className="label">Restaurant name</label>
                  <input required value={editForm.name} onChange={(e) => setEdit("name", e.target.value)} className="input" />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label className="label">Address</label>
                  <input required value={editForm.address} onChange={(e) => setEdit("address", e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Cuisine type</label>
                  <input value={editForm.cuisine} onChange={(e) => setEdit("cuisine", e.target.value)} className="input" placeholder="e.g. Italian" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input value={editForm.phone} onChange={(e) => setEdit("phone", e.target.value)} className="input" />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label className="label">Email</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEdit("email", e.target.value)} className="input" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", gridColumn: "span 2" }}>
                  <div>
                    <label className="label">Opens</label>
                    <input type="time" value={editForm.openTime} onChange={(e) => setEdit("openTime", e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="label">Closes</label>
                    <input type="time" value={editForm.closeTime} onChange={(e) => setEdit("closeTime", e.target.value)} className="input" />
                  </div>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label className="label">Description <span style={{ fontWeight: 400, color: "#9a9088" }}>(optional)</span></label>
                  <textarea value={editForm.description} onChange={(e) => setEdit("description", e.target.value)} rows={3} className="input" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.625rem", marginTop: "0.25rem" }}>
                <button type="submit" disabled={editSaving} className="btn btn-primary btn-md" style={{ flex: 1 }}>
                  {editSaving ? "Saving…" : "Save changes"}
                </button>
                <button type="button" onClick={() => setIsEditingRestaurant(false)} className="btn btn-ghost btn-md">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="nav">
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>mesa</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#c4410c", background: "#fef2ec", padding: "0.2rem 0.625rem", borderRadius: "999px" }}>Owner</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {user && <span style={{ fontSize: "0.875rem", color: "#9a9088" }}>{user.name}</span>}
            <button className="btn btn-ghost btn-sm" onClick={() => { logout(); router.push("/"); }}>Sign out</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        {!restaurant ? (
          <CreateRestaurantForm onCreated={(r) => setRestaurant(r)} />
        ) : (
          <>
            {/* Header */}
            <div className="anim-1" style={{ opacity: 0, marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>{restaurant.name}</h1>
                  <p style={{ fontSize: "0.9375rem", color: "#9a9088", marginTop: "0.25rem" }}>
                    {restaurant.address} · {restaurant.openTime} – {restaurant.closeTime}
                    {restaurant.cuisine && ` · ${restaurant.cuisine}`}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-sm" onClick={openEditRestaurant}>Edit info</button>
                  <Link href={`/restaurants/${restaurant.id}`} className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }} target="_blank">
                    View public page ↗
                  </Link>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="anim-2" style={{ opacity: 0, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
              {[
                { value: reservations.length, label: "Total reservations", color: "#18160f" },
                { value: pendingCount, label: "Awaiting review", color: pendingCount > 0 ? "#b45309" : "#18160f" },
                { value: reservations.filter(r => r.status === "CONFIRMED").length, label: "Confirmed", color: "#16a34a" },
                { value: (restaurant.floors || []).length, label: "Floor sections", color: "#18160f" },
              ].map(({ value, label, color }) => (
                <div key={label} className="card" style={{ padding: "1.25rem 1.5rem" }}>
                  <p style={{ fontSize: "1.875rem", fontWeight: 700, color, letterSpacing: "-0.02em" }}>{value}</p>
                  <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginTop: "0.25rem" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Reservations — full width, primary section */}
            <div className="anim-3 card" style={{ opacity: 0, padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#18160f" }}>Reservations</h2>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {(["PENDING", "CONFIRMED", "ALL", "PAST"] as ReservationTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setResTab(tab)}
                      style={{
                        padding: "0.3rem 0.75rem",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        fontFamily: "inherit",
                        border: "1px solid",
                        borderRadius: "6px",
                        cursor: "pointer",
                        background: resTab === tab ? "#c4410c" : "#f5f3ef",
                        borderColor: resTab === tab ? "#c4410c" : "rgba(24,22,15,0.1)",
                        color: resTab === tab ? "#ffffff" : "#5c5248",
                        transition: "all 0.15s",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      {tab === "ALL" ? "All" : tab === "PAST" ? "Past" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                      {tab === "PENDING" && pendingCount > 0 && (
                        <span style={{
                          fontSize: "0.625rem",
                          fontWeight: 700,
                          background: resTab === "PENDING" ? "rgba(255,255,255,0.25)" : "#c4410c",
                          color: resTab === "PENDING" ? "#fff" : "#fff",
                          padding: "0.05rem 0.35rem",
                          borderRadius: "999px",
                          minWidth: "16px",
                          textAlign: "center",
                        }}>
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={fetchReservations}
                    title="Refresh"
                    style={{ padding: "0.3rem 0.625rem", fontSize: "0.875rem", border: "1px solid rgba(24,22,15,0.1)", borderRadius: "6px", cursor: "pointer", background: "#f5f3ef", color: "#5c5248", fontFamily: "inherit" }}
                  >
                    ↻
                  </button>
                </div>
              </div>

              {filteredReservations.length === 0 ? (
                <div style={{ padding: "2.5rem", textAlign: "center" }}>
                  <p style={{ fontSize: "0.9375rem", color: "#9a9088" }}>
                    {resTab === "PENDING" ? "No pending requests — you're all caught up." : "No reservations in this category."}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  {/* Table header */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 120px 80px 120px 160px",
                    gap: "0.75rem",
                    padding: "0.5rem 0.75rem",
                    background: "#fafaf8",
                    borderRadius: "6px",
                    marginBottom: "0.25rem",
                  }}>
                    {["Guest", "Date & Time", "Table", "Party", "Status", "Actions"].map((h) => (
                      <span key={h} style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
                    ))}
                  </div>

                  {filteredReservations.map((r, i) => {
                    const guestName = r.user?.name || r.guestName || "Guest";
                    const guestEmail = r.user?.email || r.guestEmail || "";
                    const guestPhone = r.user?.phone || r.guestPhone || "";
                    const st = STATUS_STYLE[r.status] || STATUS_STYLE.PENDING;
                    const isPending = r.status === "PENDING";
                    const isConfirmed = r.status === "CONFIRMED";
                    const accepting = actionLoading === r.id + "CONFIRMED";
                    const declining = actionLoading === r.id + "CANCELLED";
                    const completing = actionLoading === r.id + "COMPLETED";

                    return (
                      <div
                        key={r.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 120px 80px 120px 160px",
                          gap: "0.75rem",
                          padding: "0.875rem 0.75rem",
                          borderTop: i === 0 ? "none" : "1px solid rgba(24,22,15,0.06)",
                          alignItems: "center",
                          background: isPending ? "rgba(255,251,235,0.4)" : "transparent",
                          borderRadius: isPending ? "6px" : "0",
                          transition: "background 0.15s",
                        }}
                      >
                        {/* Guest */}
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#18160f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {guestName}
                          </p>
                          {guestEmail && (
                            <a href={`mailto:${guestEmail}`} style={{ fontSize: "0.75rem", color: "#9a9088", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {guestEmail}
                            </a>
                          )}
                          {guestPhone && (
                            <p style={{ fontSize: "0.75rem", color: "#9a9088", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{guestPhone}</p>
                          )}
                        </div>

                        {/* Date & Time */}
                        <div>
                          <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#18160f" }}>{r.date}</p>
                          <p style={{ fontSize: "0.75rem", color: "#9a9088" }}>{r.startTime} – {r.endTime}</p>
                          {r.notes && (
                            <p style={{ fontSize: "0.7rem", color: "#5c5248", marginTop: "0.25rem", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.notes}>
                              {r.notes}
                            </p>
                          )}
                        </div>

                        {/* Table */}
                        <div>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#18160f" }}>
                            {r.table ? `Table ${r.table.label}` : "—"}
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
                        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleStatusChange(r.id, "CONFIRMED")}
                                disabled={!!actionLoading}
                                style={{
                                  padding: "0.3rem 0.625rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  fontFamily: "inherit",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: actionLoading ? "not-allowed" : "pointer",
                                  background: "#16a34a",
                                  color: "#fff",
                                  opacity: accepting ? 0.7 : 1,
                                  transition: "opacity 0.15s",
                                }}
                              >
                                {accepting ? "…" : "Accept"}
                              </button>
                              <button
                                onClick={() => handleStatusChange(r.id, "CANCELLED")}
                                disabled={!!actionLoading}
                                style={{
                                  padding: "0.3rem 0.625rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  fontFamily: "inherit",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: actionLoading ? "not-allowed" : "pointer",
                                  background: "#fef2f2",
                                  color: "#dc2626",
                                  opacity: declining ? 0.7 : 1,
                                  transition: "opacity 0.15s",
                                }}
                              >
                                {declining ? "…" : "Decline"}
                              </button>
                            </>
                          )}
                          {isConfirmed && (
                            <>
                              <button
                                onClick={() => handleStatusChange(r.id, "COMPLETED")}
                                disabled={!!actionLoading}
                                style={{
                                  padding: "0.3rem 0.625rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  fontFamily: "inherit",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: actionLoading ? "not-allowed" : "pointer",
                                  background: "#eff6ff",
                                  color: "#2563eb",
                                  opacity: completing ? 0.7 : 1,
                                  transition: "opacity 0.15s",
                                }}
                              >
                                {completing ? "…" : "Complete"}
                              </button>
                              <button
                                onClick={() => handleStatusChange(r.id, "CANCELLED")}
                                disabled={!!actionLoading}
                                style={{
                                  padding: "0.3rem 0.625rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  fontFamily: "inherit",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: actionLoading ? "not-allowed" : "pointer",
                                  background: "#f5f3ef",
                                  color: "#9a9088",
                                  opacity: actionLoading === r.id + "CANCELLED" ? 0.7 : 1,
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Floors */}
            <div className="anim-4 card" style={{ opacity: 0, padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#18160f", marginBottom: "1.25rem" }}>Floor Sections</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {(restaurant.floors || []).length === 0 && (
                  <div style={{ padding: "2rem", textAlign: "center", background: "#f5f3ef", borderRadius: "8px", border: "2px dashed rgba(24,22,15,0.1)" }}>
                    <p style={{ fontSize: "0.9375rem", color: "#9a9088" }}>No floors yet — add your first section below.</p>
                  </div>
                )}
                {(restaurant.floors || []).map((floor: Floor) => {
                  const s = SECTION_LABELS[floor.sectionType] || SECTION_LABELS.INDOOR;
                  const isDeleting = deletingFloor === floor.id;
                  return (
                    <div
                      key={floor.id}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", background: "#fafaf8", border: "1px solid rgba(24,22,15,0.08)", borderRadius: "8px", opacity: isDeleting ? 0.5 : 1, transition: "opacity 0.15s" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                        <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: s.color, background: s.bg, padding: "0.2rem 0.5rem", borderRadius: "999px", flexShrink: 0 }}>{s.label}</span>
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: "#18160f" }}>{floor.name}</span>
                          <span style={{ fontSize: "0.75rem", color: "#9a9088", marginLeft: "0.5rem" }}>{floor.width}×{floor.height}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                        <Link href={`/editor/${floor.id}`} className="btn btn-sm btn-outline" style={{ textDecoration: "none" }}>Edit layout</Link>
                        <button
                          onClick={() => handleDeleteFloor(floor.id, floor.name)}
                          disabled={isDeleting}
                          title="Delete floor section"
                          style={{ padding: "0.35rem 0.5rem", background: "#fef2f2", border: "none", borderRadius: "6px", color: "#dc2626", cursor: isDeleting ? "not-allowed" : "pointer", fontSize: "0.875rem", lineHeight: 1 }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add floor */}
              <div style={{ paddingTop: "1.25rem", borderTop: "1px solid rgba(24,22,15,0.08)" }}>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#5c5248", marginBottom: "0.875rem" }}>Add a section</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  <div style={{ display: "flex", gap: "0.625rem" }}>
                    <input
                      placeholder="Section name"
                      value={newFloorName}
                      onChange={(e) => setNewFloorName(e.target.value)}
                      className="input"
                      style={{ flex: 1 }}
                      onKeyDown={(e) => e.key === "Enter" && addFloor()}
                    />
                    <select value={newFloorType} onChange={(e) => setNewFloorType(e.target.value)} className="input" style={{ width: "auto" }}>
                      <option value="INDOOR">Indoor</option>
                      <option value="OUTDOOR">Outdoor</option>
                      <option value="BAR">Bar</option>
                      <option value="PRIVATE">Private</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flex: 1 }}>
                      <label style={{ fontSize: "0.8125rem", color: "#9a9088", whiteSpace: "nowrap" }}>W</label>
                      <input type="number" min={200} max={2000} value={newFloorWidth} onChange={(e) => setNewFloorWidth(Math.max(200, +e.target.value))} className="input" style={{ flex: 1 }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flex: 1 }}>
                      <label style={{ fontSize: "0.8125rem", color: "#9a9088", whiteSpace: "nowrap" }}>H</label>
                      <input type="number" min={200} max={2000} value={newFloorHeight} onChange={(e) => setNewFloorHeight(Math.max(200, +e.target.value))} className="input" style={{ flex: 1 }} />
                    </div>
                    <button className="btn btn-primary btn-md" onClick={addFloor} style={{ flexShrink: 0 }}>Add</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CreateRestaurantForm({ onCreated }: { onCreated: (r: Restaurant) => void }) {
  const [form, setForm] = useState({ name: "", description: "", address: "", phone: "", email: "", cuisine: "", openTime: "09:00", closeTime: "22:00" });
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data } = await api.post("/restaurants", form);
      onCreated(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Failed to create restaurant");
    }
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div className="anim-1" style={{ opacity: 0, marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>List your restaurant</h1>
        <p style={{ fontSize: "0.9375rem", color: "#9a9088" }}>Complete your profile to start accepting reservations.</p>
      </div>
      <div className="anim-2 card" style={{ opacity: 0, padding: "2rem" }}>
        {error && (
          <div style={{ padding: "0.75rem 1rem", background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1.5rem" }}>{error}</div>
        )}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ gridColumn: "span 2" }}>
              <label className="label">Restaurant name</label>
              <input required value={form.name} onChange={(e) => set("name", e.target.value)} className="input" placeholder="e.g. The Golden Fork" />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label className="label">Address</label>
              <input required value={form.address} onChange={(e) => set("address", e.target.value)} className="input" placeholder="123 Main St, City" />
            </div>
            <div>
              <label className="label">Cuisine type</label>
              <input value={form.cuisine} onChange={(e) => set("cuisine", e.target.value)} className="input" placeholder="e.g. Italian" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="input" placeholder="+1 555 000 0000" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="input" placeholder="hello@restaurant.com" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <label className="label">Opens</label>
                <input type="time" value={form.openTime} onChange={(e) => set("openTime", e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Closes</label>
                <input type="time" value={form.closeTime} onChange={(e) => set("closeTime", e.target.value)} className="input" />
              </div>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label className="label">Description <span style={{ fontWeight: 400, color: "#9a9088" }}>(optional)</span></label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="input" placeholder="Tell guests what makes your restaurant special…" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-md" style={{ width: "100%", marginTop: "0.5rem" }}>Create restaurant profile</button>
        </form>
      </div>
    </div>
  );
}
