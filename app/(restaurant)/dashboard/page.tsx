"use client";

import { useEffect, useState } from "react";
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

export default function DashboardPage() {
  const { user, logout, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [newFloorName, setNewFloorName] = useState("");
  const [newFloorType, setNewFloorType] = useState("INDOOR");
  const [reservations, setReservations] = useState<{ id: string; date: string; startTime: string; partySize: number; status: string; user?: { name: string } }[]>([]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user || user.role !== "RESTAURANT_OWNER") { router.push("/login"); return; }
    Promise.all([
      api.get("/restaurants/me").then(({ data }) => { setRestaurant(data); return data; }),
      api.get("/reservations/restaurant").then(({ data }) => setReservations(data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user, _hasHydrated]);

  async function addFloor() {
    if (!newFloorName.trim()) return;
    const { data } = await api.post("/floors", { name: newFloorName, sectionType: newFloorType });
    setRestaurant((r) => r ? { ...r, floors: [...(r.floors || []), data] } : r);
    setNewFloorName("");
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
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>mesa</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#c4410c", background: "#fef2ec", padding: "0.2rem 0.625rem", borderRadius: "999px" }}>
              Owner
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {user && <span style={{ fontSize: "0.875rem", color: "#9a9088" }}>{user.name}</span>}
            <button className="btn btn-ghost btn-sm" onClick={() => { logout(); router.push("/"); }}>Sign out</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {!restaurant ? (
          <CreateRestaurantForm onCreated={(r) => { setRestaurant(r); }} />
        ) : (
          <>
            {/* Header */}
            <div className="anim-1" style={{ opacity: 0, marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>
                    {restaurant.name}
                  </h1>
                  <p style={{ fontSize: "0.9375rem", color: "#9a9088", marginTop: "0.25rem" }}>
                    {restaurant.address} · {restaurant.openTime} – {restaurant.closeTime}
                    {restaurant.cuisine && ` · ${restaurant.cuisine}`}
                  </p>
                </div>
                <Link
                  href={`/restaurants/${restaurant.id}`}
                  className="btn btn-ghost btn-sm"
                  style={{ textDecoration: "none", flexShrink: 0 }}
                  target="_blank"
                >
                  View public page ↗
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="anim-2" style={{ opacity: 0, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
              {[
                { value: reservations.length, label: "Total reservations", color: "#18160f" },
                { value: reservations.filter(r => r.status === "PENDING").length, label: "Pending", color: "#b45309" },
                { value: (restaurant.floors || []).length, label: "Floor sections", color: "#18160f" },
              ].map(({ value, label, color }) => (
                <div key={label} className="card" style={{ padding: "1.25rem 1.5rem" }}>
                  <p style={{ fontSize: "1.875rem", fontWeight: 700, color, letterSpacing: "-0.02em" }}>{value}</p>
                  <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginTop: "0.25rem" }}>{label}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem", alignItems: "start" }}>

              {/* Floors */}
              <div className="anim-3 card" style={{ opacity: 0, padding: "1.5rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#18160f", marginBottom: "1.25rem" }}>
                  Floor Sections
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  {(restaurant.floors || []).length === 0 && (
                    <div style={{ padding: "2rem", textAlign: "center", background: "#f5f3ef", borderRadius: "8px", border: "2px dashed rgba(24,22,15,0.1)" }}>
                      <p style={{ fontSize: "0.9375rem", color: "#9a9088" }}>No floors yet — add your first section below.</p>
                    </div>
                  )}
                  {(restaurant.floors || []).map((floor: Floor) => {
                    const s = SECTION_LABELS[floor.sectionType] || SECTION_LABELS.INDOOR;
                    return (
                      <div
                        key={floor.id}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", background: "#fafaf8", border: "1px solid rgba(24,22,15,0.08)", borderRadius: "8px" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: s.color, background: s.bg, padding: "0.2rem 0.5rem", borderRadius: "999px" }}>
                            {s.label}
                          </span>
                          <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: "#18160f" }}>{floor.name}</span>
                        </div>
                        <Link
                          href={`/editor/${floor.id}`}
                          className="btn btn-sm btn-outline"
                          style={{ textDecoration: "none" }}
                        >
                          Edit layout
                        </Link>
                      </div>
                    );
                  })}
                </div>

                {/* Add floor */}
                <div style={{ paddingTop: "1.25rem", borderTop: "1px solid rgba(24,22,15,0.08)" }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#5c5248", marginBottom: "0.875rem" }}>Add a section</p>
                  <div style={{ display: "flex", gap: "0.625rem" }}>
                    <input
                      placeholder="Section name"
                      value={newFloorName}
                      onChange={(e) => setNewFloorName(e.target.value)}
                      className="input"
                      style={{ flex: 1 }}
                      onKeyDown={(e) => e.key === "Enter" && addFloor()}
                    />
                    <select
                      value={newFloorType}
                      onChange={(e) => setNewFloorType(e.target.value)}
                      className="input"
                      style={{ width: "auto" }}
                    >
                      <option value="INDOOR">Indoor</option>
                      <option value="OUTDOOR">Outdoor</option>
                      <option value="BAR">Bar</option>
                      <option value="PRIVATE">Private</option>
                    </select>
                    <button className="btn btn-primary btn-md" onClick={addFloor} style={{ flexShrink: 0 }}>
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Reservations */}
              <div className="anim-4 card" style={{ opacity: 0, padding: "1.5rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#18160f", marginBottom: "1.25rem" }}>
                  Reservations
                </h2>

                {reservations.length === 0 && (
                  <p style={{ fontSize: "0.875rem", color: "#9a9088", textAlign: "center", padding: "2rem 0" }}>
                    No reservations yet
                  </p>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  {reservations.slice(0, 12).map((r, i) => (
                    <div
                      key={r.id}
                      style={{ padding: "0.875rem 0", borderBottom: i < reservations.length - 1 ? "1px solid rgba(24,22,15,0.06)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}
                    >
                      <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#18160f" }}>
                          {r.user?.name || "Guest"}
                        </p>
                        <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginTop: "0.1rem" }}>
                          {r.date} · {r.startTime} · {r.partySize}p
                        </p>
                      </div>
                      <span
                        className="badge"
                        style={{
                          background: r.status === "CONFIRMED" ? "#f0fdf4" : r.status === "PENDING" ? "#fffbeb" : "#f8f8f7",
                          color: r.status === "CONFIRMED" ? "#16a34a" : r.status === "PENDING" ? "#b45309" : "#9a9088",
                          flexShrink: 0,
                        }}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
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
  const [form, setForm] = useState({
    name: "", description: "", address: "", phone: "",
    email: "", cuisine: "", openTime: "09:00", closeTime: "22:00",
  });
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
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
          List your restaurant
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "#9a9088" }}>
          Complete your profile to start accepting reservations.
        </p>
      </div>

      <div className="anim-2 card" style={{ opacity: 0, padding: "2rem" }}>
        {error && (
          <div style={{ padding: "0.75rem 1rem", background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            {error}
          </div>
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
          <button type="submit" className="btn btn-primary btn-md" style={{ width: "100%", marginTop: "0.5rem" }}>
            Create restaurant profile
          </button>
        </form>
      </div>
    </div>
  );
}
