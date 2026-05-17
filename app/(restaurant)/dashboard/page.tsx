"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Restaurant, Floor } from "@/types";
import { FLOOR_PRESETS, FloorPreset } from "@/lib/floorPresets";
import Sparkline from "@/components/ui/Sparkline";

const SECTION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  INDOOR:  { label: "Indoor",  color: "#2563eb", bg: "#eff6ff" },
  OUTDOOR: { label: "Outdoor", color: "#16a34a", bg: "#f0fdf4" },
  BAR:     { label: "Bar",     color: "#c4410c", bg: "#fef2ec" },
  PRIVATE: { label: "Private", color: "#7c3aed", bg: "#f5f3ff" },
};

type RestaurantFormData = {
  name: string; description: string; address: string; phone: string;
  email: string; cuisine: string; openTime: string; closeTime: string;
};

type ResDashItem = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  partySize: number;
  guestName?: string;
  user?: { name: string };
  table?: { label: string };
};

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
}

function sparklineFor(reservations: ResDashItem[], days: string[], filter?: (r: ResDashItem) => boolean): number[] {
  return days.map((day) => reservations.filter((r) => r.date === day && (!filter || filter(r))).length);
}

function peakHourCounts(reservations: ResDashItem[]): number[] {
  const counts = new Array(24).fill(0);
  for (const r of reservations) {
    const h = parseInt(r.startTime.split(":")[0], 10);
    if (!isNaN(h)) counts[h]++;
  }
  return counts;
}

function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

export default function DashboardPage() {
  const { user, logout, _hasHydrated, can } = useAuthStore();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [allReservations, setAllReservations] = useState<ResDashItem[]>([]);
  const [confirmingAll, setConfirmingAll] = useState(false);

  const [newFloorName, setNewFloorName] = useState("");
  const [newFloorType, setNewFloorType] = useState("INDOOR");
  const [newFloorWidth, setNewFloorWidth] = useState(800);
  const [newFloorHeight, setNewFloorHeight] = useState(600);
  const [pendingPreset, setPendingPreset] = useState<FloorPreset | null>(null);
  const [isEditingRestaurant, setIsEditingRestaurant] = useState(false);
  const [editForm, setEditForm] = useState<RestaurantFormData>({ name: "", description: "", address: "", phone: "", email: "", cuisine: "", openTime: "09:00", closeTime: "22:00" });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deletingFloor, setDeletingFloor] = useState<string | null>(null);
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [editFloorForm, setEditFloorForm] = useState({ name: "", sectionType: "INDOOR", width: 800, height: 600 });
  const [editFloorSaving, setEditFloorSaving] = useState(false);

  const days7 = getLast7Days();
  const today = new Date().toISOString().split("T")[0];
  const now = nowTime();

  // Derived: summary
  const pending = allReservations.filter((r) => r.status === "PENDING").length;
  const confirmed = allReservations.filter((r) => r.status === "CONFIRMED").length;
  const total = allReservations.length;

  // Derived: sparklines
  const totalSparkline = sparklineFor(allReservations, days7);
  const pendingSparkline = sparklineFor(allReservations, days7, (r) => r.status === "PENDING");
  const confirmedSparkline = sparklineFor(allReservations, days7, (r) => r.status === "CONFIRMED");

  // Derived: today's timeline
  const todayConfirmed = allReservations
    .filter((r) => r.date === today && ["CONFIRMED", "SEATED"].includes(r.status))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const nowSeated = todayConfirmed.filter((r) => r.startTime <= now && r.endTime >= now);
  const arriving = todayConfirmed.filter((r) => r.startTime > now);
  const leavingSoon = nowSeated.filter((r) => r.endTime <= addMins(now, 45));

  // Derived: peak hours heatmap
  const hourCounts = peakHourCounts(allReservations);
  const maxHour = Math.max(...hourCounts, 1);
  const PEAK_HOURS = Array.from({ length: 16 }, (_, i) => i + 8); // 8am - 11pm

  const fetchReservations = useCallback(async () => {
    const { data } = await api.get("/reservations/restaurant");
    setAllReservations(data);
  }, []);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user || !can("FLOOR_PLAN")) { router.push("/login"); return; }
    Promise.all([
      api.get("/restaurants/me").then(({ data }) => setRestaurant(data)),
      fetchReservations(),
    ]).finally(() => setLoading(false));
  }, [user, _hasHydrated]); // eslint-disable-line

  async function confirmAllPending() {
    const ids = allReservations.filter((r) => r.status === "PENDING").map((r) => r.id);
    if (!ids.length) return;
    setConfirmingAll(true);
    try {
      await api.post("/reservations/bulk-status", { ids, status: "CONFIRMED" });
      setAllReservations((rs) => rs.map((r) => r.status === "PENDING" ? { ...r, status: "CONFIRMED" } : r));
    } catch {
      alert("Failed to confirm reservations");
    } finally {
      setConfirmingAll(false);
    }
  }

  async function addFloor() {
    if (!newFloorName.trim()) return;
    const payload: Record<string, unknown> = { name: newFloorName, sectionType: newFloorType, width: newFloorWidth, height: newFloorHeight };
    if (pendingPreset) {
      payload.tables = pendingPreset.tables;
      payload.walls = pendingPreset.walls;
    }
    const { data } = await api.post("/floors", payload);
    setRestaurant((r) => r ? { ...r, floors: [...(r.floors || []), data] } : r);
    setNewFloorName(""); setNewFloorType("INDOOR"); setNewFloorWidth(800); setNewFloorHeight(600); setPendingPreset(null);
  }

  function startEditFloor(floor: Floor) {
    setEditingFloorId(floor.id);
    setEditFloorForm({ name: floor.name, sectionType: floor.sectionType, width: floor.width, height: floor.height });
  }

  async function handleSaveFloorEdit(floorId: string) {
    if (!editFloorForm.name.trim()) return;
    setEditFloorSaving(true);
    try {
      const { data } = await api.put(`/floors/${floorId}`, editFloorForm);
      setRestaurant((r) => r ? { ...r, floors: (r.floors || []).map((f) => (f.id === floorId ? { ...f, ...data } : f)) } : r);
      setEditingFloorId(null);
    } catch {
      alert("Failed to save floor section.");
    } finally {
      setEditFloorSaving(false);
    }
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
    setEditForm({ name: restaurant.name, description: restaurant.description || "", address: restaurant.address, phone: restaurant.phone, email: restaurant.email, cuisine: restaurant.cuisine || "", openTime: restaurant.openTime, closeTime: restaurant.closeTime });
    setEditError("");
    setIsEditingRestaurant(true);
  }

  async function handleEditRestaurant(e: React.FormEvent) {
    e.preventDefault();
    setEditSaving(true); setEditError("");
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

  const setEdit = (k: keyof RestaurantFormData, v: string) => setEditForm((f) => ({ ...f, [k]: v }));

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
              <div style={{ padding: "0.75rem 1rem", background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1.25rem" }}>{editError}</div>
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
                <button type="submit" disabled={editSaving} className="btn btn-primary btn-md" style={{ flex: 1 }}>{editSaving ? "Saving…" : "Save changes"}</button>
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
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#c4410c", background: "#fef2ec", padding: "0.2rem 0.625rem", borderRadius: "999px" }}>
              {user?.role === "RESTAURANT_OWNER" ? "Owner" : "Staff"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link href="/manage-reservations" style={{ textDecoration: "none" }}>
              <button className="btn btn-ghost btn-sm" style={{ position: "relative" }}>
                Reservations
                {pending > 0 && (
                  <span style={{ position: "absolute", top: "-4px", right: "-4px", width: "16px", height: "16px", background: "#c4410c", color: "#fff", borderRadius: "50%", fontSize: "0.6rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {pending}
                  </span>
                )}
              </button>
            </Link>
            <Link href="/menu" style={{ textDecoration: "none" }}><button className="btn btn-ghost btn-sm">Menu</button></Link>
            <Link href="/settings" style={{ textDecoration: "none" }}><button className="btn btn-ghost btn-sm">Settings</button></Link>
            {can("REPORTS") && <Link href="/dashboard/reports" style={{ textDecoration: "none" }}><button className="btn btn-ghost btn-sm">Reports</button></Link>}
            {can("STAFF_MANAGE") && <Link href="/dashboard/staff" style={{ textDecoration: "none" }}><button className="btn btn-ghost btn-sm">Staff</button></Link>}
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
            <div className="anim-1" style={{ opacity: 0, marginBottom: "1.75rem" }}>
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
                  <Link href={`/restaurants/${restaurant.id}`} className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }} target="_blank">View public page ↗</Link>
                </div>
              </div>
            </div>

            {/* Quick actions bar */}
            {pending > 0 && (
              <div className="anim-1" style={{ opacity: 0, display: "flex", gap: "0.75rem", marginBottom: "1.25rem", padding: "0.875rem 1.25rem", background: "#fffbeb", border: "1px solid rgba(180,83,9,0.25)", borderRadius: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#b45309" }}>
                  {pending} pending request{pending > 1 ? "s" : ""} waiting
                </span>
                <div style={{ flex: 1 }} />
                <Link href="/manage-reservations?tab=PENDING" style={{ textDecoration: "none" }}>
                  <button className="btn btn-ghost btn-sm" style={{ borderColor: "rgba(180,83,9,0.3)", color: "#b45309" }}>Review one by one</button>
                </Link>
                <button
                  onClick={confirmAllPending}
                  disabled={confirmingAll}
                  style={{ padding: "0.375rem 1rem", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit", border: "none", borderRadius: "6px", cursor: confirmingAll ? "not-allowed" : "pointer", background: "#16a34a", color: "#fff", opacity: confirmingAll ? 0.7 : 1 }}
                >
                  {confirmingAll ? "Confirming…" : `Confirm all ${pending}`}
                </button>
              </div>
            )}

            {/* Stats with sparklines */}
            <div className="anim-2" style={{ opacity: 0, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
              {[
                { value: total, label: "Total reservations", color: "#18160f", sparkData: totalSparkline, sparkColor: "#18160f" },
                { value: pending, label: "Awaiting review", color: pending > 0 ? "#b45309" : "#18160f", sparkData: pendingSparkline, sparkColor: "#b45309" },
                { value: confirmed, label: "Confirmed", color: "#16a34a", sparkData: confirmedSparkline, sparkColor: "#16a34a" },
                { value: (restaurant.floors || []).length, label: "Floor sections", color: "#18160f", sparkData: null, sparkColor: "#18160f" },
              ].map(({ value, label, color, sparkData, sparkColor }) => (
                <div key={label} className="card" style={{ padding: "1.25rem 1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: "1.875rem", fontWeight: 700, color, letterSpacing: "-0.02em" }}>{value}</p>
                      <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginTop: "0.125rem" }}>{label}</p>
                    </div>
                    {sparkData && (
                      <div style={{ marginTop: "0.25rem", opacity: 0.85 }}>
                        <Sparkline data={sparkData} color={sparkColor} height={36} width={72} />
                      </div>
                    )}
                  </div>
                  {sparkData && (
                    <p style={{ fontSize: "0.7rem", color: "#c8c4be", marginTop: "0.5rem" }}>7-day trend</p>
                  )}
                </div>
              ))}
            </div>

            {/* Today's timeline */}
            {todayConfirmed.length > 0 && (
              <div className="anim-2" style={{ opacity: 0, marginBottom: "1.5rem" }}>
                <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#18160f" }}>
                      Today&apos;s bookings
                      <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#9a9088", marginLeft: "0.5rem" }}>{todayConfirmed.length} total</span>
                    </h2>
                    <Link href={`/manage-reservations?date=${today}&tab=CONFIRMED`} style={{ textDecoration: "none", fontSize: "0.8125rem", color: "#c4410c" }}>
                      Manage →
                    </Link>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                    {/* Currently seated */}
                    <div>
                      <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                        Seated now · {nowSeated.length}
                      </p>
                      {nowSeated.length === 0 ? (
                        <p style={{ fontSize: "0.8125rem", color: "#c8c4be" }}>None currently</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                          {nowSeated.slice(0, 4).map((r) => (
                            <TimelineCard key={r.id} r={r} highlight={leavingSoon.some((l) => l.id === r.id) ? "leaving" : "current"} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Arriving next */}
                    <div>
                      <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                        Arriving next · {arriving.length}
                      </p>
                      {arriving.length === 0 ? (
                        <p style={{ fontSize: "0.8125rem", color: "#c8c4be" }}>No more today</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                          {arriving.slice(0, 4).map((r) => (
                            <TimelineCard key={r.id} r={r} highlight="upcoming" />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Peak hours heatmap */}
                    <div>
                      <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                        Peak hours
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                        {PEAK_HOURS.map((h) => {
                          const count = hourCounts[h] || 0;
                          const intensity = count / maxHour;
                          const bg = count === 0
                            ? "rgba(24,22,15,0.05)"
                            : `rgba(196,65,12,${0.12 + intensity * 0.75})`;
                          return (
                            <div
                              key={h}
                              title={`${String(h).padStart(2, "0")}:00 — ${count} booking${count !== 1 ? "s" : ""}`}
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "4px",
                                background: bg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.5625rem",
                                fontWeight: 600,
                                color: intensity > 0.5 ? "#fff" : "#9a9088",
                                cursor: "default",
                              }}
                            >
                              {h}
                            </div>
                          );
                        })}
                      </div>
                      <p style={{ fontSize: "0.7rem", color: "#c8c4be", marginTop: "0.5rem" }}>Hover for count</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No bookings today placeholder */}
            {todayConfirmed.length === 0 && (
              <div className="anim-2" style={{ opacity: 0, marginBottom: "1.5rem", padding: "1rem 1.5rem", background: "#ffffff", border: "1px solid rgba(24,22,15,0.07)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#18160f" }}>No confirmed bookings today</p>
                  <p style={{ fontSize: "0.8125rem", color: "#9a9088" }}>Timeline will appear when guests are confirmed for today.</p>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <Link href="/new-booking" style={{ textDecoration: "none" }}>
                    <button className="btn btn-primary btn-sm">+ Add booking</button>
                  </Link>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>

              {/* Floors */}
              <div className="anim-3 card" style={{ opacity: 0, padding: "1.5rem" }}>
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
                    const isEditing = editingFloorId === floor.id;
                    if (isEditing) {
                      return (
                        <div key={floor.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.875rem 1rem", background: "#fafaf8", border: "1px solid rgba(24,22,15,0.08)", borderRadius: "8px" }}>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input value={editFloorForm.name} onChange={(e) => setEditFloorForm((f) => ({ ...f, name: e.target.value }))} className="input" style={{ flex: 1 }} placeholder="Section name" />
                            <select value={editFloorForm.sectionType} onChange={(e) => setEditFloorForm((f) => ({ ...f, sectionType: e.target.value }))} className="input" style={{ width: "auto" }}>
                              <option value="INDOOR">Indoor</option><option value="OUTDOOR">Outdoor</option><option value="BAR">Bar</option><option value="PRIVATE">Private</option>
                            </select>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flex: 1 }}>
                              <label style={{ fontSize: "0.8125rem", color: "#9a9088", whiteSpace: "nowrap" }}>W</label>
                              <input type="number" min={200} max={2000} value={editFloorForm.width} onChange={(e) => setEditFloorForm((f) => ({ ...f, width: Math.max(200, +e.target.value) }))} className="input" style={{ flex: 1 }} />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flex: 1 }}>
                              <label style={{ fontSize: "0.8125rem", color: "#9a9088", whiteSpace: "nowrap" }}>H</label>
                              <input type="number" min={200} max={2000} value={editFloorForm.height} onChange={(e) => setEditFloorForm((f) => ({ ...f, height: Math.max(200, +e.target.value) }))} className="input" style={{ flex: 1 }} />
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={() => handleSaveFloorEdit(floor.id)} disabled={editFloorSaving}>{editFloorSaving ? "Saving…" : "Save"}</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingFloorId(null)}>Cancel</button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={floor.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", background: "#fafaf8", border: "1px solid rgba(24,22,15,0.08)", borderRadius: "8px", opacity: isDeleting ? 0.5 : 1, transition: "opacity 0.15s" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                          <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: s.color, background: s.bg, padding: "0.2rem 0.5rem", borderRadius: "999px", flexShrink: 0 }}>{s.label}</span>
                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: "#18160f" }}>{floor.name}</span>
                            <span style={{ fontSize: "0.75rem", color: "#9a9088", marginLeft: "0.5rem" }}>{floor.width}×{floor.height}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                          <button onClick={() => startEditFloor(floor)} className="btn btn-sm btn-outline">Edit</button>
                          <Link href={`/editor/${floor.id}`} className="btn btn-sm btn-outline" style={{ textDecoration: "none" }}>Edit layout</Link>
                          <button onClick={() => handleDeleteFloor(floor.id, floor.name)} disabled={isDeleting} title="Delete" style={{ padding: "0.35rem 0.5rem", background: "#fef2f2", border: "none", borderRadius: "6px", color: "#dc2626", cursor: isDeleting ? "not-allowed" : "pointer", fontSize: "0.875rem", lineHeight: 1 }}>×</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ paddingTop: "1.25rem", borderTop: "1px solid rgba(24,22,15,0.08)" }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#5c5248", marginBottom: "0.875rem" }}>Add a section</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                    {FLOOR_PRESETS.map((preset) => {
                      const s = SECTION_LABELS[preset.sectionType];
                      return (
                        <button key={preset.name} type="button" onClick={() => { setNewFloorName(preset.name); setNewFloorType(preset.sectionType); setNewFloorWidth(preset.width); setNewFloorHeight(preset.height); setPendingPreset(preset); }}
                          style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.35rem 0.625rem", borderRadius: "999px", border: "1px solid rgba(24,22,15,0.12)", background: s?.bg || "#ffffff", color: s?.color || "#5c5248", cursor: "pointer", whiteSpace: "nowrap" }}
                          title={`${preset.name} — ${preset.width}×${preset.height}`}
                        >
                          {preset.name}
                        </button>
                      );
                    })}
                  </div>
                  {pendingPreset && (
                    <div style={{ fontSize: "0.75rem", color: "#5c5248", marginBottom: "0.25rem" }}>
                      Preset &quot;{pendingPreset.name}&quot; — {pendingPreset.tables.length} table{pendingPreset.tables.length !== 1 ? "s" : ""}{pendingPreset.walls.length ? ` · ${pendingPreset.walls.length} wall${pendingPreset.walls.length !== 1 ? "s" : ""}` : ""}.
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    <div style={{ display: "flex", gap: "0.625rem" }}>
                      <input placeholder="Section name" value={newFloorName} onChange={(e) => { setNewFloorName(e.target.value); setPendingPreset(null); }} className="input" style={{ flex: 1 }} onKeyDown={(e) => e.key === "Enter" && addFloor()} />
                      <select value={newFloorType} onChange={(e) => { setNewFloorType(e.target.value); setPendingPreset(null); }} className="input" style={{ width: "auto" }}>
                        <option value="INDOOR">Indoor</option><option value="OUTDOOR">Outdoor</option><option value="BAR">Bar</option><option value="PRIVATE">Private</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flex: 1 }}>
                        <label style={{ fontSize: "0.8125rem", color: "#9a9088", whiteSpace: "nowrap" }}>W</label>
                        <input type="number" min={200} max={2000} value={newFloorWidth} onChange={(e) => { setNewFloorWidth(Math.max(200, +e.target.value)); setPendingPreset(null); }} className="input" style={{ flex: 1 }} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flex: 1 }}>
                        <label style={{ fontSize: "0.8125rem", color: "#9a9088", whiteSpace: "nowrap" }}>H</label>
                        <input type="number" min={200} max={2000} value={newFloorHeight} onChange={(e) => { setNewFloorHeight(Math.max(200, +e.target.value)); setPendingPreset(null); }} className="input" style={{ flex: 1 }} />
                      </div>
                      <button className="btn btn-primary btn-md" onClick={addFloor} style={{ flexShrink: 0 }}>Add</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right sidebar */}
              <div className="anim-4" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
                <Link href="/manage-reservations" style={{ textDecoration: "none" }}>
                  <div className="card-hover" style={{ padding: "1.5rem", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#18160f" }}>Reservations</h3>
                      <span style={{ fontSize: "0.875rem", color: "#c4410c" }}>Manage →</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.875rem", color: "#5c5248" }}>Pending review</span>
                        <span style={{ fontSize: "1rem", fontWeight: 700, color: pending > 0 ? "#b45309" : "#18160f" }}>{pending}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.875rem", color: "#5c5248" }}>Confirmed</span>
                        <span style={{ fontSize: "1rem", fontWeight: 700, color: "#16a34a" }}>{confirmed}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.875rem", color: "#5c5248" }}>Total</span>
                        <span style={{ fontSize: "1rem", fontWeight: 700, color: "#18160f" }}>{total}</span>
                      </div>
                    </div>
                    {pending > 0 && (
                      <div style={{ marginTop: "1rem", padding: "0.5rem 0.75rem", background: "#fffbeb", border: "1px solid rgba(180,83,9,0.2)", borderRadius: "6px", fontSize: "0.8125rem", color: "#b45309", fontWeight: 500 }}>
                        {pending} request{pending > 1 ? "s" : ""} waiting for response
                      </div>
                    )}
                  </div>
                </Link>

                <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#5c5248", marginBottom: "0.625rem" }}>Quick actions</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {pending > 0 && (
                      <button
                        onClick={confirmAllPending}
                        disabled={confirmingAll}
                        style={{ width: "100%", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 600, fontFamily: "inherit", border: "none", borderRadius: "8px", cursor: confirmingAll ? "not-allowed" : "pointer", background: "#16a34a", color: "#fff", opacity: confirmingAll ? 0.7 : 1, textAlign: "center" }}
                      >
                        {confirmingAll ? "Confirming…" : `Confirm all ${pending} pending`}
                      </button>
                    )}
                    <Link href="/new-booking" style={{ textDecoration: "none" }}>
                      <button style={{ width: "100%", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 600, fontFamily: "inherit", border: "1px solid rgba(24,22,15,0.12)", borderRadius: "8px", cursor: "pointer", background: "#fff", color: "#18160f", textAlign: "center" }}>
                        + New manual booking
                      </button>
                    </Link>
                    <Link href="/manage-reservations" style={{ textDecoration: "none" }}>
                      <button style={{ width: "100%", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 500, fontFamily: "inherit", border: "1px solid rgba(24,22,15,0.08)", borderRadius: "8px", cursor: "pointer", background: "#f5f3ef", color: "#5c5248", textAlign: "center" }}>
                        View all reservations
                      </button>
                    </Link>
                    <Link href="/menu" style={{ textDecoration: "none" }}>
                      <button style={{ width: "100%", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 500, fontFamily: "inherit", border: "1px solid rgba(24,22,15,0.08)", borderRadius: "8px", cursor: "pointer", background: "#f5f3ef", color: "#5c5248", textAlign: "center" }}>
                        Manage menus
                      </button>
                    </Link>
                    <Link href={`/restaurants/${restaurant.id}`} target="_blank" style={{ textDecoration: "none" }}>
                      <button style={{ width: "100%", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 500, fontFamily: "inherit", border: "1px solid rgba(24,22,15,0.08)", borderRadius: "8px", cursor: "pointer", background: "#f5f3ef", color: "#5c5248", textAlign: "center" }}>
                        View public page ↗
                      </button>
                    </Link>
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

function addMins(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function TimelineCard({ r, highlight }: { r: ResDashItem; highlight: "current" | "upcoming" | "leaving" }) {
  const name = r.user?.name || r.guestName || "Guest";
  const bgColors = {
    current: "rgba(22,163,74,0.06)",
    upcoming: "rgba(37,99,235,0.05)",
    leaving: "rgba(196,65,12,0.07)",
  };
  const borderColors = {
    current: "rgba(22,163,74,0.2)",
    upcoming: "rgba(37,99,235,0.15)",
    leaving: "rgba(196,65,12,0.2)",
  };
  return (
    <div style={{ padding: "0.5rem 0.75rem", background: bgColors[highlight], border: `1px solid ${borderColors[highlight]}`, borderRadius: "6px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#18160f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
        <span style={{ fontSize: "0.75rem", color: "#9a9088", flexShrink: 0 }}>{r.partySize}p</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.1rem" }}>
        <span style={{ fontSize: "0.75rem", color: "#5c5248" }}>{r.startTime}–{r.endTime}</span>
        {r.table && <span style={{ fontSize: "0.7rem", color: "#9a9088" }}>T{r.table.label}</span>}
        {highlight === "leaving" && <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#c4410c", background: "#fef2ec", padding: "0.05rem 0.3rem", borderRadius: "999px" }}>leaving soon</span>}
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
        {error && <div style={{ padding: "0.75rem 1rem", background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1.5rem" }}>{error}</div>}
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
