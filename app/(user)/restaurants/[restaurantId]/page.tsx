"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { Restaurant, Floor, TableItem } from "@/types";
import { useAuthStore } from "@/store/auth.store";

const FloorViewCanvas = dynamic(() => import("@/components/canvas/FloorViewCanvas"), { ssr: false });

export default function RestaurantDetailPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [booking, setBooking] = useState({ date: "", startTime: "", endTime: "", partySize: 2, notes: "" });
  const [bookingMsg, setBookingMsg] = useState("");
  const [bookingErr, setBookingErr] = useState("");

  useEffect(() => {
    api.get(`/restaurants/${restaurantId}`).then(({ data }) => {
      setRestaurant(data);
      if (data.floors?.length) loadFloor(data.floors[0].id);
    });
  }, [restaurantId]);

  async function loadFloor(id: string) {
    const { data } = await api.get(`/floors/${id}`);
    setSelectedFloor(data);
    setSelectedTable(null);
  }

  async function handleBook() {
    if (!user) { router.push("/login"); return; }
    if (!selectedTable) { setBookingErr("Please select a table first"); return; }
    setBookingErr("");
    try {
      await api.post("/reservations", { tableId: selectedTable.id, ...booking, partySize: +booking.partySize });
      setBookingMsg("Reservation confirmed! Check My Reservations.");
      setSelectedTable(null);
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
      {/* Nav */}
      <nav className="nav">
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => router.back()}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9088", fontSize: "0.875rem", fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            ← Back
          </button>
          <div style={{ width: "1px", height: "16px", background: "rgba(24,22,15,0.1)" }} />
          <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>mesa</span>
        </div>
      </nav>

      {/* Restaurant hero */}
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

      {/* Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem", display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>

        {/* Floor canvas */}
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
              <div style={{ background: "#f9f7f4", display: "flex", justifyContent: "center", padding: "1rem" }}>
                <FloorViewCanvas
                  floor={selectedFloor}
                  selectedTableId={selectedTable?.id ?? null}
                  onSelectTable={setSelectedTable}
                />
              </div>
            </div>
          )}
        </div>

        {/* Booking sidebar */}
        <aside style={{ width: "316px", flexShrink: 0 }} className="anim-3">
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#18160f", marginBottom: "1.25rem", letterSpacing: "-0.01em" }}>
              Make a Reservation
            </h3>

            {selectedTable ? (
              <div style={{ padding: "0.75rem 1rem", background: "#fef2ec", border: "1px solid rgba(196,65,12,0.2)", borderRadius: "8px", marginBottom: "1.25rem" }}>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#c4410c" }}>Table {selectedTable.label}</p>
                <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginTop: "0.125rem" }}>
                  Up to {selectedTable.capacity} guests{selectedTable.isWindowSeat ? " · Window seat" : ""}
                </p>
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
                <input type="date" value={booking.date} onChange={(e) => setBooking((b) => ({ ...b, date: e.target.value }))} className="input" style={{ colorScheme: "light" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                <div>
                  <label className="label">Arrival</label>
                  <input type="time" value={booking.startTime} onChange={(e) => setBooking((b) => ({ ...b, startTime: e.target.value }))} className="input" style={{ colorScheme: "light" }} />
                </div>
                <div>
                  <label className="label">Departure</label>
                  <input type="time" value={booking.endTime} onChange={(e) => setBooking((b) => ({ ...b, endTime: e.target.value }))} className="input" style={{ colorScheme: "light" }} />
                </div>
              </div>
              <div>
                <label className="label">Guests</label>
                <input type="number" min={1} value={booking.partySize} onChange={(e) => setBooking((b) => ({ ...b, partySize: +e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Special requests</label>
                <textarea value={booking.notes} onChange={(e) => setBooking((b) => ({ ...b, notes: e.target.value }))} rows={2} className="input" placeholder="Dietary needs, occasion…" />
              </div>
              <button onClick={handleBook} className="btn btn-primary btn-md" style={{ width: "100%", marginTop: "0.25rem" }}>
                {user ? "Reserve table" : "Sign in to reserve"}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
