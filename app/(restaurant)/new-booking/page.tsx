"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Floor, Restaurant, TableItem } from "@/types";

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
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", padding: "0.625rem 1rem", borderTop: "1px solid rgba(24,22,15,0.06)" }}>
      {[
        { color: "#dcfce7", border: "#a8a09a", label: "Available" },
        { color: "#dbeafe", border: "#a8a09a", label: "Window seat" },
        { color: "#fde8df", border: "#c4410c", label: "Selected" },
        { color: "#e5e2dd", border: "#c8c4be", label: "Booked" },
        { color: "#f0ede8", border: "#c8c4be", label: "Too small" },
      ].map((item) => (
        <span key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "#5c5248" }}>
          <span style={{ display: "inline-block", width: 12, height: 12, background: item.color, border: `1px solid ${item.border}`, borderRadius: 2, flexShrink: 0 }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export default function NewBookingPage() {
  const { user, _hasHydrated, can } = useAuthStore();
  const router = useRouter();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  // Floor canvas state
  const [floorsData, setFloorsData] = useState<Record<string, Floor>>({});
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [occupiedIds, setOccupiedIds] = useState<Set<string>>(new Set());
  const [tableBookings, setTableBookings] = useState<Record<string, { startTime: string; endTime: string }[]>>({});
  const [availLoading, setAvailLoading] = useState(false);
  const [availFetched, setAvailFetched] = useState(false);

  // Booking form
  const [date, setDate] = useState(TODAY);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const prevAvailKey = useRef("");

  // Auth guard + load restaurant + floors
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user || !can("RESERVATIONS_WRITE")) { router.push("/login"); return; }

    api.get<Restaurant>("/restaurants/me").then(async ({ data }) => {
      setRestaurant(data);
      if (!data.floors?.length) { setLoading(false); return; }

      const firstFloorId = data.floors[0].id;
      setSelectedFloorId(firstFloorId);

      // Load all floors in parallel
      const results = await Promise.all(
        data.floors.map((f) => api.get<Floor>(`/floors/${f.id}`).then(({ data: fd }) => fd))
      );
      const map: Record<string, Floor> = {};
      for (const fd of results) map[fd.id] = fd;
      setFloorsData(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, _hasHydrated, router]);

  // Fetch availability whenever date is set (bookings shown)
  // and re-fetch when time window is complete (occupied tables marked)
  const fetchAvailability = useCallback(async (d: string, st?: string, et?: string) => {
    if (!d) return;
    const key = st && et ? `${d}|${st}|${et}` : `${d}`;
    if (prevAvailKey.current === key) return;
    prevAvailKey.current = key;

    setAvailLoading(true);
    try {
      const params = new URLSearchParams({ date: d });
      if (st) params.set("startTime", st);
      if (et) params.set("endTime", et);
      const { data } = await api.get<{
        floors: {
          tables: { id: string; available: boolean; bookings: { startTime: string; endTime: string }[] }[];
        }[];
      }>(`/reservations/availability?${params}`);
      const booked = new Set<string>();
      const bookingsMap: Record<string, { startTime: string; endTime: string }[]> = {};
      for (const fl of data.floors) {
        for (const t of fl.tables) {
          if (!t.available) booked.add(t.id);
          bookingsMap[t.id] = t.bookings;
        }
      }
      setOccupiedIds(booked);
      setTableBookings(bookingsMap);
      setAvailFetched(true);
      // deselect table if it just became occupied
      setSelectedTable((prev) => (prev && booked.has(prev.id) ? null : prev));
    } catch {
      // silently ignore — canvas just won't dim booked tables
    } finally {
      setAvailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (date) {
      if (startTime && endTime && startTime < endTime) {
        fetchAvailability(date, startTime, endTime);
      } else {
        fetchAvailability(date);
      }
    } else {
      setOccupiedIds(new Set());
      setTableBookings({});
      setAvailFetched(false);
      prevAvailKey.current = "";
    }
  }, [date, startTime, endTime, fetchAvailability]);

  // Build display floor: overlay occupancy onto isActive
  const rawFloor = selectedFloorId ? floorsData[selectedFloorId] : null;
  const displayFloor: Floor | null = rawFloor
    ? {
        ...rawFloor,
        tables: rawFloor.tables?.map((t) => ({
          ...t,
          isActive: t.isActive && !occupiedIds.has(t.id),
        })),
      }
    : null;

  const timeReady = !!(date && startTime && endTime && startTime < endTime);

  async function handleSubmit() {
    setError("");
    if (!selectedTable) { setError("Select a table on the floor plan"); return; }
    if (!date || !startTime || !endTime) { setError("Date and times are required"); return; }
    if (startTime >= endTime) { setError("End time must be after start time"); return; }
    if (!guestName.trim()) { setError("Guest name is required"); return; }

    setSubmitting(true);
    try {
      await api.post("/reservations/manual", {
        tableId: selectedTable.id,
        date,
        startTime,
        endTime,
        partySize,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim() || undefined,
        guestEmail: guestEmail.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push("/manage-reservations"), 1800);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(typeof msg === "string" ? msg : "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  }

  const slots = restaurant ? halfHourSlots(restaurant.openTime, restaurant.closeTime) : [];

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
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link
            href="/manage-reservations"
            style={{ textDecoration: "none", color: "#9a9088", fontSize: "0.875rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.35rem", transition: "color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#18160f")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9a9088")}
          >
            ← Reservations
          </Link>
          <div style={{ width: "1px", height: "16px", background: "rgba(24,22,15,0.1)" }} />
          <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>mesa</span>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#c4410c", background: "#fef2ec", padding: "0.2rem 0.625rem", borderRadius: "999px" }}>Owner</span>
        </div>
      </nav>

      {/* Page header */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid rgba(24,22,15,0.08)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.75rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, background: "#fef2ec", color: "#c4410c", padding: "0.25rem 0.625rem", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Staff booking
                </span>
              </div>
              <h1 style={{ fontSize: "1.625rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>New Manual Reservation</h1>
              <p style={{ fontSize: "0.875rem", color: "#9a9088", marginTop: "0.25rem" }}>
                Phone-in or walk-up · Confirms immediately, no approval needed
              </p>
            </div>
            {restaurant && (
              <p style={{ fontSize: "0.8125rem", color: "#9a9088" }}>
                {restaurant.name} · Open {restaurant.openTime} – {restaurant.closeTime}
              </p>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.75rem 1.5rem", display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>

        {/* ── Left: Floor plan ── */}
        <div style={{ flex: 1, minWidth: 0 }} className="anim-1" suppressHydrationWarning>

          {/* Floor tabs */}
          {(restaurant?.floors || []).length > 1 && (
            <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              {(restaurant?.floors || []).map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setSelectedFloorId(f.id); setSelectedTable(null); }}
                  style={{
                    padding: "0.375rem 0.875rem",
                    fontSize: "0.8125rem", fontWeight: 500,
                    fontFamily: "inherit", border: "1px solid", borderRadius: "6px",
                    cursor: "pointer", transition: "all 0.15s",
                    background: selectedFloorId === f.id ? "#18160f" : "#ffffff",
                    borderColor: selectedFloorId === f.id ? "#18160f" : "rgba(24,22,15,0.15)",
                    color: selectedFloorId === f.id ? "#ffffff" : "#5c5248",
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}

          {/* Canvas card */}
          {displayFloor ? (
            <div className="card" style={{ overflow: "hidden" }}>
              {/* Canvas toolbar */}
              <div style={{
                padding: "0.75rem 1rem", borderBottom: "1px solid rgba(24,22,15,0.06)",
                background: "#fafaf8", display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c4410c" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span style={{ fontSize: "0.8125rem", color: "#5c5248" }}>
                    {timeReady
                      ? availLoading
                        ? "Checking availability…"
                        : availFetched
                          ? `Select an available table for ${date} · ${startTime} – ${endTime}`
                          : "Click a table to select it"
                      : "Set date and times to see live availability"}
                  </span>
                </div>
                {availLoading && (
                  <div style={{ width: "14px", height: "14px", border: "2px solid #f0ede8", borderTopColor: "#c4410c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                )}
              </div>

              {/* Canvas */}
              <div style={{ background: "#f9f7f4", padding: "1rem" }}>
                <FloorViewCanvas
                  floor={displayFloor}
                  selectedTableId={selectedTable?.id ?? null}
                  onSelectTable={(t) => {
                    setSelectedTable(t);
                    setError("");
                  }}
                  partySize={partySize}
                  tableBookings={tableBookings}
                  occupiedIds={occupiedIds}
                />
              </div>

              <Legend />
            </div>
          ) : (
            <div className="card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
              <p style={{ fontSize: "1rem", fontWeight: 600, color: "#18160f", marginBottom: "0.5rem" }}>No floor plans</p>
              <p style={{ fontSize: "0.875rem", color: "#9a9088" }}>
                Set up your floor layout in the{" "}
                <Link href="/dashboard" style={{ color: "#c4410c" }}>dashboard</Link> first.
              </p>
            </div>
          )}
        </div>

        {/* ── Right: Booking form ── */}
        <aside style={{ width: "320px", flexShrink: 0 }} className="anim-2">
          <div className="card" style={{ padding: "1.5rem" }}>

            {success ? (
              <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
                <div style={{ width: "48px", height: "48px", background: "#f0fdf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: "1.5rem" }}>
                  ✓
                </div>
                <p style={{ fontSize: "1rem", fontWeight: 700, color: "#16a34a", marginBottom: "0.375rem" }}>Booking confirmed!</p>
                <p style={{ fontSize: "0.875rem", color: "#9a9088" }}>Redirecting to reservations…</p>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#18160f", marginBottom: "1.25rem", letterSpacing: "-0.01em" }}>
                  Booking details
                </h3>

                {/* Selected table indicator */}
                {selectedTable ? (
                  <div style={{ background: "#fef2ec", border: "1px solid rgba(196,65,12,0.2)", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#c4410c" }}>Table {selectedTable.label}</p>
                      <p style={{ fontSize: "0.75rem", color: "#9a9088", marginTop: "0.1rem" }}>
                        {selectedTable.minCapacity}–{selectedTable.capacity} guests{selectedTable.isWindowSeat ? " · Window" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedTable(null)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9088", fontSize: "1rem", lineHeight: 1, padding: "0.25rem", fontFamily: "inherit" }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div style={{ background: "#f5f3ef", border: "1px dashed rgba(24,22,15,0.15)", borderRadius: "8px", padding: "0.875rem 1rem", marginBottom: "1.25rem", textAlign: "center" }}>
                    <p style={{ fontSize: "0.8125rem", color: "#9a9088" }}>← Click a table on the floor plan</p>
                  </div>
                )}

                {error && (
                  <div style={{ padding: "0.625rem 0.875rem", background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", color: "#dc2626", fontSize: "0.8125rem", marginBottom: "1.25rem" }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                  {/* Date */}
                  <div>
                    <label className="label">Date</label>
                    <input
                      type="date"
                      min={TODAY}
                      value={date}
                      onChange={(e) => { setDate(e.target.value); setSelectedTable(null); }}
                      className="input"
                      style={{ colorScheme: "light" }}
                    />
                  </div>

                  {/* Times */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                    <div>
                      <label className="label">Arrival</label>
                      <select
                        value={startTime}
                        onChange={(e) => { setStartTime(e.target.value); setSelectedTable(null); }}
                        className="input"
                      >
                        <option value="">--:--</option>
                        {slots.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Departure</label>
                      <select
                        value={endTime}
                        onChange={(e) => { setEndTime(e.target.value); setSelectedTable(null); }}
                        className="input"
                      >
                        <option value="">--:--</option>
                        {slots.filter((t) => !startTime || t > startTime).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Party size */}
                  <div>
                    <label className="label">Party size</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <button
                        onClick={() => { setPartySize((n) => Math.max(1, n - 1)); setSelectedTable(null); }}
                        style={counterBtnStyle}
                      >−</button>
                      <span style={{ minWidth: "32px", textAlign: "center", fontSize: "1.125rem", fontWeight: 700, color: "#18160f" }}>{partySize}</span>
                      <button
                        onClick={() => { setPartySize((n) => Math.min(30, n + 1)); setSelectedTable(null); }}
                        style={counterBtnStyle}
                      >+</button>
                      <span style={{ fontSize: "0.8125rem", color: "#9a9088" }}>guests</span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#9a9088", marginTop: "0.375rem" }}>
                      Tables too small are dimmed on the map
                    </p>
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: "1px solid rgba(24,22,15,0.08)", paddingTop: "0.25rem" }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.875rem" }}>
                      Guest info
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <div>
                        <label className="label">Name <span style={{ color: "#c4410c" }}>*</span></label>
                        <input
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Full name"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Phone</label>
                        <input
                          type="tel"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="+1 555 000 0000"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Email <span style={{ fontWeight: 400, color: "#9a9088" }}>(optional)</span></label>
                        <input
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="guest@email.com"
                          className="input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="label">Notes <span style={{ fontWeight: 400, color: "#9a9088" }}>(optional)</span></label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Special requests, occasion, dietary needs…"
                      className="input"
                      style={{ resize: "none" }}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn btn-primary btn-md"
                    style={{ width: "100%", marginTop: "0.25rem", opacity: submitting ? 0.65 : 1 }}
                  >
                    {submitting ? "Confirming…" : "Confirm booking"}
                  </button>

                  <p style={{ fontSize: "0.75rem", color: "#9a9088", textAlign: "center" }}>
                    Reservation is confirmed immediately — no approval step
                  </p>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

const counterBtnStyle: React.CSSProperties = {
  width: "32px", height: "32px",
  border: "1px solid rgba(24,22,15,0.15)",
  borderRadius: "6px", background: "#fafaf8",
  color: "#18160f", fontSize: "1.125rem",
  cursor: "pointer", display: "flex",
  alignItems: "center", justifyContent: "center",
  fontFamily: "inherit",
};
