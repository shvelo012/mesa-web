"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { Restaurant, Floor, TableItem, Menu } from "@/types";
import { useAuthStore } from "@/store/auth.store";
import MenuDisplay from "@/components/menu/MenuDisplay";

const FloorViewCanvas = dynamic(() => import("@/components/canvas/FloorViewCanvas"), { ssr: false });

const TODAY = new Date().toISOString().split("T")[0];

function halfHourSlots(open: string, close: string): string[] {
  const slots: string[] = [];
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  let mins = Math.ceil((oh * 60 + om) / 30) * 30;
  const endMins = ch * 60 + cm;
  while (mins <= endMins) {
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
    mins += 30;
  }
  return slots;
}

function Legend() {
  const items = [
    { color: "#dcfce7", border: "#a8a09a", label: "Available" },
    { color: "#dbeafe", border: "#a8a09a", label: "Window seat" },
    { color: "#fde8df", border: "#c4410c", label: "Selected" },
    { color: "#e5e2dd", border: "#c8c4be", label: "Unavailable" },
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", padding: "0.625rem 1rem", borderTop: "1px solid rgba(24,22,15,0.06)" }}>
      {items.map((item) => (
        <span key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "#5c5248" }}>
          <span style={{ display: "inline-block", width: 12, height: 12, background: item.color, border: `1px solid ${item.border}`, borderRadius: 2, flexShrink: 0 }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export default function RestaurantDetailPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [booking, setBooking] = useState({ date: "", startTime: "", endTime: "", partySize: 2, notes: "" });
  const [guest, setGuest] = useState({ name: "", email: "", phone: "" });
  const [userContact, setUserContact] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: "" });
  const [editingContact, setEditingContact] = useState(false);
  const [bookingMsg, setBookingMsg] = useState("");
  const [bookingErr, setBookingErr] = useState("");
  const [menus, setMenus] = useState<Menu[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (user) setUserContact((c) => ({ ...c, name: c.name || user.name, email: c.email || user.email }));
  }, [user]);

  useEffect(() => {
    api.get(`/restaurants/${restaurantId}`).then(({ data }) => {
      setRestaurant(data);
      if (data.floors?.length) loadFloor(data.floors[0].id);
    });
    api.get(`/menus/public/${restaurantId}`).then(({ data }) => setMenus(data)).catch(() => {});
  }, [restaurantId]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  async function loadFloor(id: string) {
    const { data } = await api.get(`/floors/${id}`);
    setSelectedFloor(data);
    setSelectedTable(null);
    setBookingMsg("");
    setBookingErr("");
  }

  async function handleBook() {
    if (!selectedTable) { setBookingErr("Please select a table first"); return; }
    if (!user && (!guest.name.trim() || !guest.email.trim())) {
      setBookingErr("Name and email are required");
      return;
    }
    if (!booking.date) { setBookingErr("Please select a date"); return; }
    if (!booking.startTime) { setBookingErr("Please set arrival time"); return; }
    if (booking.endTime && booking.startTime >= booking.endTime) { setBookingErr("Departure must be after arrival"); return; }
    if (booking.partySize > selectedTable.capacity) {
      setBookingErr(`Table ${selectedTable.label} fits ${selectedTable.capacity} guests max`);
      return;
    }

    setBookingErr("");
    try {
      const payload: Record<string, unknown> = { tableId: selectedTable.id, ...booking, partySize: +booking.partySize };
      if (!user) {
        payload.guestName = guest.name.trim();
        payload.guestEmail = guest.email.trim();
        if (guest.phone.trim()) payload.guestPhone = guest.phone.trim();
      } else {
        if (userContact.name.trim() !== user.name || userContact.email.trim() !== user.email) {
          payload.guestName = userContact.name.trim();
          payload.guestEmail = userContact.email.trim();
        }
        if (userContact.phone.trim()) payload.guestPhone = userContact.phone.trim();
      }
      await api.post("/reservations", payload);
      setBookingMsg(
        "Request sent. The restaurant will review your reservation — you'll receive an email once it's accepted."
      );
      setSelectedTable(null);
      if (!user) setGuest({ name: "", email: "", phone: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setBookingErr(msg || "Booking failed");
    }
  }

  if (!restaurant) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f3ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid #f0ede8", borderTopColor: "#c4410c", borderRadius: "50%", margin: "0 auto 1rem", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: "0.875rem", color: "#9a9088" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh" }}>
      <nav className="nav">
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => user?.role === "RESTAURANT_OWNER" ? router.push("/dashboard") : router.back()}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9088", fontSize: "0.875rem", fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            ← Back
          </button>
          <div style={{ width: "1px", height: "16px", background: "rgba(24,22,15,0.1)" }} />
          <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>mesa</span>
          <div style={{ flex: 1 }} />
          {user && (
            <button
              onClick={() => { logout(); router.push("/login"); }}
              style={{ background: "none", border: "1px solid rgba(24,22,15,0.12)", cursor: "pointer", color: "#9a9088", fontSize: "0.8125rem", fontWeight: 500, fontFamily: "inherit", padding: "0.375rem 0.75rem", borderRadius: "6px" }}
            >
              Sign out
            </button>
          )}
        </div>
      </nav>

      <div style={{ background: "#ffffff", borderBottom: "1px solid rgba(24,22,15,0.08)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }} className="anim-1">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              {restaurant.cuisine && (
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#c4410c", background: "#fef2ec", padding: "0.25rem 0.625rem", borderRadius: "999px", display: "inline-block", marginBottom: "0.625rem" }}>
                  {restaurant.cuisine}
                </span>
              )}
              <h1 style={{ fontSize: "clamp(1.625rem, 3vw, 2.25rem)", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
                {restaurant.name}
              </h1>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem" }}>
                <span style={{ fontSize: "0.875rem", color: "#9a9088", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {restaurant.address}
                </span>
                <span style={{ fontSize: "0.875rem", color: "#9a9088", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                  {restaurant.openTime} – {restaurant.closeTime}
                </span>
              </div>
              {restaurant.description && (
                <p style={{ fontSize: "0.9375rem", color: "#5c5248", marginTop: "0.75rem", maxWidth: "540px", lineHeight: 1.6 }}>
                  {restaurant.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem", display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>

        <div style={{ flex: 1, minWidth: 0 }} className="anim-2" suppressHydrationWarning>

          {(restaurant.floors || []).length > 1 && (
            <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1rem" }}>
              {(restaurant.floors || []).map((f: Floor) => (
                <button
                  key={f.id}
                  onClick={() => loadFloor(f.id)}
                  className={selectedFloor?.id === f.id ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
                  style={{ fontFamily: "inherit" }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}

          {selectedFloor && (
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(24,22,15,0.06)", display: "flex", alignItems: "center", gap: "0.5rem", background: "#fafaf8" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c4410c" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontSize: "0.8125rem", color: "#9a9088" }}>Click a table to select it for booking</span>
              </div>
              <div style={{ background: "#f9f7f4", padding: "1rem" }}>
                <FloorViewCanvas
                  floor={selectedFloor}
                  selectedTableId={selectedTable?.id ?? null}
                  onSelectTable={setSelectedTable}
                  partySize={booking.partySize}
                />
              </div>
              <Legend />
            </div>
          )}
        </div>

        <aside style={{ width: "316px", flexShrink: 0 }} className="anim-3">
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#18160f", marginBottom: "1.25rem", letterSpacing: "-0.01em" }}>
              Make a Reservation
            </h3>

            {selectedTable ? (
              <div style={{ background: "#fef2ec", border: "1px solid rgba(196,65,12,0.2)", borderRadius: "8px", marginBottom: "1.25rem", overflow: "hidden" }}>
                {selectedTable.imageUrl && (
                  <button
                    onClick={() => setLightbox(selectedTable.imageUrl || null)}
                    title="Click to enlarge"
                    style={{ display: "block", width: "100%", padding: 0, border: "none", background: "transparent", cursor: "zoom-in" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedTable.imageUrl}
                      alt={`Table ${selectedTable.label}`}
                      style={{ display: "block", width: "100%", height: "150px", objectFit: "cover" }}
                    />
                  </button>
                )}
                <div style={{ padding: "0.75rem 1rem" }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#c4410c" }}>Table {selectedTable.label}</p>
                  <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginTop: "0.125rem" }}>
                    Up to {selectedTable.capacity} guests{selectedTable.isWindowSeat ? " · Window seat" : ""}
                  </p>
                  {selectedTable.notes && (
                    <p style={{ fontSize: "0.75rem", color: "#5c5248", marginTop: "0.375rem", fontStyle: "italic" }}>
                      {selectedTable.notes}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: "0.75rem 1rem", background: "#f5f3ef", border: "1px solid rgba(24,22,15,0.08)", borderRadius: "8px", marginBottom: "1.25rem", textAlign: "center" }}>
                <p style={{ fontSize: "0.8125rem", color: "#9a9088" }}>← Select a table from the map</p>
              </div>
            )}

            {bookingMsg && (
              <div style={{ padding: "0.75rem 1rem", background: "#f0fdf4", border: "1px solid rgba(22,163,74,0.2)", borderRadius: "8px", color: "#16a34a", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                {bookingMsg}
              </div>
            )}
            {bookingErr && (
              <div style={{ padding: "0.75rem 1rem", background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                {bookingErr}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  min={TODAY}
                  value={booking.date}
                  onChange={(e) => setBooking((b) => ({ ...b, date: e.target.value }))}
                  className="input"
                  style={{ colorScheme: "light" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                <div>
                  <label className="label">Arrival</label>
                  <select value={booking.startTime} onChange={(e) => setBooking((b) => ({ ...b, startTime: e.target.value }))} className="input">
                    <option value="">--:--</option>
                    {halfHourSlots(restaurant.openTime, restaurant.closeTime).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Departure</label>
                  <select value={booking.endTime} onChange={(e) => setBooking((b) => ({ ...b, endTime: e.target.value }))} className="input">
                    <option value="">--:--</option>
                    {halfHourSlots(restaurant.openTime, restaurant.closeTime).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Guests</label>
                <input
                  type="number"
                  min={1}
                  value={booking.partySize}
                  onChange={(e) => {
                    setBooking((b) => ({ ...b, partySize: +e.target.value }));
                    setSelectedTable(null);
                  }}
                  className="input"
                />
                <p style={{ fontSize: "0.75rem", color: "#9a9088", marginTop: "0.25rem" }}>
                  Tables too small for your party are dimmed on the map
                </p>
              </div>
              <div>
                <label className="label">Special requests</label>
                <textarea value={booking.notes} onChange={(e) => setBooking((b) => ({ ...b, notes: e.target.value }))} rows={2} className="input" placeholder="Dietary needs, occasion…" />
              </div>
              {user ? (
                <div style={{ borderTop: "1px solid rgba(24,22,15,0.08)", paddingTop: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#5c5248" }}>Booking as</p>
                    <button
                      onClick={() => setEditingContact((v) => !v)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", color: "#c4410c", fontFamily: "inherit", fontWeight: 600, padding: 0 }}
                    >
                      {editingContact ? "Done" : "Edit"}
                    </button>
                  </div>
                  {editingContact ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                      <div>
                        <label className="label">Name</label>
                        <input
                          type="text"
                          value={userContact.name}
                          onChange={(e) => setUserContact((c) => ({ ...c, name: e.target.value }))}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Email</label>
                        <input
                          type="email"
                          value={userContact.email}
                          onChange={(e) => setUserContact((c) => ({ ...c, email: e.target.value }))}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Phone <span style={{ fontWeight: 400, color: "#9a9088" }}>(optional)</span></label>
                        <input
                          type="tel"
                          value={userContact.phone}
                          onChange={(e) => setUserContact((c) => ({ ...c, phone: e.target.value }))}
                          className="input"
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "0.75rem 1rem", background: "#f5f3ef", borderRadius: "8px" }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#18160f" }}>{userContact.name || user.name}</p>
                      <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginTop: "0.125rem" }}>{userContact.email || user.email}</p>
                      {userContact.phone && (
                        <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginTop: "0.125rem" }}>{userContact.phone}</p>
                      )}
                      <p style={{ fontSize: "0.7rem", color: "#9a9088", marginTop: "0.375rem" }}>
                        This info will be shared with the restaurant.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ borderTop: "1px solid rgba(24,22,15,0.08)", paddingTop: "1rem" }}>
                  <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginBottom: "0.75rem" }}>Your details</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div>
                      <label className="label">Name *</label>
                      <input type="text" value={guest.name} onChange={(e) => setGuest((g) => ({ ...g, name: e.target.value }))} className="input" placeholder="Full name" />
                    </div>
                    <div>
                      <label className="label">Email *</label>
                      <input type="email" value={guest.email} onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))} className="input" placeholder="your@email.com" />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input type="tel" value={guest.phone} onChange={(e) => setGuest((g) => ({ ...g, phone: e.target.value }))} className="input" placeholder="+1 234 567 8900" />
                    </div>
                  </div>
                </div>
              )}
              <button onClick={handleBook} className="btn btn-primary btn-md" style={{ width: "100%", marginTop: "0.25rem" }}>
                Reserve table
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Menu section */}
      {menus.length > 0 && (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem 3rem" }} className="anim-4">
          <div style={{ borderTop: "1px solid rgba(24,22,15,0.09)", paddingTop: "2rem" }}>
            <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#18160f", letterSpacing: "-0.02em", margin: "0 0 1.5rem" }}>Menu</h2>
            <MenuDisplay menus={menus} />
          </div>
        </div>
      )}

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,12,8,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "2rem",
            cursor: "zoom-out",
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            aria-label="Close"
            style={{
              position: "absolute",
              top: "1.25rem",
              right: "1.25rem",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              width: 36,
              height: 36,
              borderRadius: "50%",
              fontSize: "1.25rem",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Table photo"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "min(90vw, 1100px)",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: "8px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              cursor: "default",
            }}
          />
        </div>
      )}
    </div>
  );
}
