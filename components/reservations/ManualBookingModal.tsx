"use client";

import { useState } from "react";
import { api } from "@/lib/api";

type FloorData = {
  id: string;
  name: string;
  sectionType: string;
  tables: {
    id: string;
    label: string;
    capacity: number;
    minCapacity: number;
    isWindowSeat: boolean;
    shape: string;
    available: boolean;
  }[];
};

type Step = 1 | 2 | 3;

const SECTION_COLORS: Record<string, { color: string; bg: string }> = {
  INDOOR: { color: "#2563eb", bg: "#eff6ff" },
  OUTDOOR: { color: "#16a34a", bg: "#f0fdf4" },
  BAR: { color: "#c4410c", bg: "#fef2ec" },
  PRIVATE: { color: "#7c3aed", bg: "#f5f3ff" },
};

interface Props {
  onClose: () => void;
  onCreated: () => void;
  restaurantOpenTime?: string;
  restaurantCloseTime?: string;
  restaurantReservationTimes?: string[] | null;
}

export function ManualBookingModal({
  onClose,
  onCreated,
  restaurantOpenTime,
  restaurantCloseTime,
  restaurantReservationTimes,
}: Props) {
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState("");

  // Step 1: Guest info
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  // Step 2: When
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [partySize, setPartySize] = useState(2);
  const [partySizeRaw, setPartySizeRaw] = useState("2");
  const [startTime, setStartTime] = useState(restaurantOpenTime || "");

  // Step 3: Table
  const [floors, setFloors] = useState<FloorData[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [availLoading, setAvailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function fetchAvailability() {
    setAvailLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ date, startTime });
      const { data } = await api.get<{ floors: FloorData[] }>(
        `/reservations/availability?${params}`,
      );
      setFloors(data.floors);
      if (data.floors.length > 0) setActiveFloorId(data.floors[0].id);
    } catch {
      setError("Failed to load table availability");
    } finally {
      setAvailLoading(false);
    }
  }

  function goStep2() {
    setError("");
    if (!guestName.trim()) {
      setError("Guest name is required");
      return;
    }
    setStep(2);
  }

  function goStep3() {
    setError("");
    if (!date) {
      setError("Date is required");
      return;
    }
    if (!startTime) {
      setError("Arrival time is required");
      return;
    }
    setSelectedTableId(null);
    fetchAvailability();
    setStep(3);
  }

  async function submit() {
    if (!selectedTableId) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post("/reservations/manual", {
        tableId: selectedTableId,
        date,
        startTime,
        partySize,
        notes: notes.trim() || undefined,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim() || undefined,
        guestEmail: guestEmail.trim() || undefined,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      setError(typeof msg === "string" ? msg : "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  }

  const currentFloor = floors.find((f) => f.id === activeFloorId);
  const visibleTables =
    currentFloor?.tables.filter(
      (t) => t.capacity >= partySize && t.minCapacity <= partySize,
    ) ?? [];
  const allSectionsEmpty = floors.every(
    (f) =>
      f.tables.filter(
        (t) => t.capacity >= partySize && t.minCapacity <= partySize,
      ).length === 0,
  );

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "500px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
          overflow: "hidden",
          animation: "slideUp 0.2s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.375rem 1.5rem 1.125rem",
            borderBottom: "1px solid rgba(24,22,15,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  background: "#fef2ec",
                  color: "#c4410c",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "999px",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Manual
              </span>
              <h2
                style={{
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  color: "#18160f",
                  letterSpacing: "-0.01em",
                }}
              >
                New Booking
              </h2>
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#9a9088",
                marginTop: "0.1rem",
              }}
            >
              Phone-in or walk-up — confirms immediately
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9a9088",
              fontSize: "1.375rem",
              lineHeight: 1,
              padding: "0.25rem",
              borderRadius: "6px",
            }}
          >
            ×
          </button>
        </div>

        {/* Step indicator */}
        <div
          style={{
            padding: "1rem 1.5rem 0",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          {(["Guest", "When", "Table"] as const).map((label, i) => {
            const s = i + 1;
            const done = step > s;
            const active = step === s;
            return (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  flex: s < 3 ? "none" : undefined,
                }}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    background: done
                      ? "#16a34a"
                      : active
                        ? "#c4410c"
                        : "#f0ede8",
                    color: done || active ? "#fff" : "#9a9088",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                >
                  {done ? "✓" : s}
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: active ? 600 : 400,
                    color: active ? "#18160f" : done ? "#16a34a" : "#9a9088",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
                {s < 3 && (
                  <div
                    style={{
                      width: "32px",
                      height: "1px",
                      background: done ? "#bbf7d0" : "rgba(24,22,15,0.1)",
                      margin: "0 0.125rem",
                      transition: "background 0.3s",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
          {error && (
            <div
              style={{
                padding: "0.625rem 0.875rem",
                background: "#fef2f2",
                border: "1px solid rgba(220,38,38,0.2)",
                borderRadius: "8px",
                color: "#dc2626",
                fontSize: "0.8125rem",
                marginBottom: "1rem",
              }}
            >
              {error}
            </div>
          )}

          {/* ── Step 1: Guest ── */}
          {step === 1 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.875rem",
              }}
            >
              <div>
                <label style={labelStyle}>
                  Guest name <span style={{ color: "#c4410c" }}>*</span>
                </label>
                <input
                  autoFocus
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && goStep2()}
                  placeholder="e.g. John Smith"
                  className="input"
                />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && goStep2()}
                  placeholder="+1 555 000 0000"
                  type="tel"
                  className="input"
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Email{" "}
                  <span style={{ fontWeight: 400, color: "#9a9088" }}>
                    (optional)
                  </span>
                </label>
                <input
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && goStep2()}
                  placeholder="guest@email.com"
                  type="email"
                  className="input"
                />
              </div>
              <button
                onClick={goStep2}
                className="btn btn-primary btn-md"
                style={{ width: "100%", marginTop: "0.25rem" }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 2: When ── */}
          {step === 2 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.875rem",
              }}
            >
              <div>
                <label style={labelStyle}>
                  Date <span style={{ color: "#c4410c" }}>*</span>
                </label>
                <input
                  autoFocus
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Arrival time <span style={{ color: "#c4410c" }}>*</span>
                </label>
                {restaurantReservationTimes?.length ? (
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input"
                  >
                    <option value="">--:--</option>
                    {restaurantReservationTimes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="time"
                    value={startTime}
                    min={restaurantOpenTime}
                    max={restaurantCloseTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input"
                  />
                )}
              </div>
              <div>
                <label style={labelStyle}>Party size</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                  }}
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={partySizeRaw}
                    onChange={(e) => {
                      const value = e.target.value;

                      // allow only digits
                      if (/^\d*$/.test(value)) {
                        setPartySizeRaw(value);
                      }
                    }}
                    onBlur={() => {
                      const v = parseInt(partySizeRaw, 10);

                      const clamped = isNaN(v)
                        ? partySize
                        : Math.max(1, Math.min(30, v));

                      setPartySize(clamped);
                      setPartySizeRaw(String(clamped));
                      setSelectedTableId(null);
                    }}
                    className="stepper-input"
                    style={{
                      width: "52px",
                      textAlign: "center",
                      fontSize: "1.125rem",
                      fontWeight: 700,
                      color: "#18160f",
                      border: "1px solid rgba(24,22,15,0.15)",
                      borderRadius: "6px",
                      background: "#fafaf8",
                      padding: "0 4px",
                      height: "32px",
                      fontFamily: "inherit",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#9a9088",
                      marginLeft: "0.25rem",
                    }}
                  >
                    guests
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.625rem",
                  marginTop: "0.25rem",
                }}
              >
                <button
                  onClick={() => setStep(1)}
                  className="btn btn-ghost btn-md"
                  style={{ flex: 1 }}
                >
                  ← Back
                </button>
                <button
                  onClick={goStep3}
                  className="btn btn-primary btn-md"
                  style={{ flex: 2 }}
                >
                  Find tables →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Table ── */}
          {step === 3 && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {availLoading ? (
                <div
                  style={{
                    padding: "3rem 1rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      border: "3px solid #f0ede8",
                      borderTopColor: "#c4410c",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span style={{ fontSize: "0.8125rem", color: "#9a9088" }}>
                    Checking availability…
                  </span>
                </div>
              ) : (
                <>
                  {/* Booking summary pill */}
                  <div
                    style={{
                      padding: "0.625rem 0.875rem",
                      background: "#fafaf8",
                      border: "1px solid rgba(24,22,15,0.08)",
                      borderRadius: "8px",
                      fontSize: "0.8125rem",
                      color: "#5c5248",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "#18160f" }}>
                      {guestName}
                    </span>
                    <span>·</span>
                    <span>{date}</span>
                    <span>·</span>
                    <span>{startTime}</span>
                    <span>·</span>
                    <span>
                      {partySize} guest{partySize > 1 ? "s" : ""}
                    </span>
                  </div>

                  {allSectionsEmpty ? (
                    <div
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                        background: "#fafaf8",
                        borderRadius: "10px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "#18160f",
                          marginBottom: "0.375rem",
                        }}
                      >
                        No tables available
                      </p>
                      <p style={{ fontSize: "0.8125rem", color: "#9a9088" }}>
                        No active tables can seat {partySize} guest
                        {partySize > 1 ? "s" : ""} for this time.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Floor tabs */}
                      {floors.length > 1 && (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.375rem",
                            flexWrap: "wrap",
                          }}
                        >
                          {floors.map((f) => {
                            const sc =
                              SECTION_COLORS[f.sectionType] ??
                              SECTION_COLORS.INDOOR;
                            const isActive = activeFloorId === f.id;
                            const floorAvailCount = f.tables.filter(
                              (t) =>
                                t.available &&
                                t.capacity >= partySize &&
                                t.minCapacity <= partySize,
                            ).length;
                            return (
                              <button
                                key={f.id}
                                onClick={() => setActiveFloorId(f.id)}
                                style={{
                                  padding: "0.3rem 0.75rem",
                                  fontSize: "0.8rem",
                                  fontWeight: 500,
                                  fontFamily: "inherit",
                                  border: "1px solid",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                  background: isActive ? sc.bg : "#fafaf8",
                                  borderColor: isActive
                                    ? sc.color
                                    : "rgba(24,22,15,0.1)",
                                  color: isActive ? sc.color : "#5c5248",
                                }}
                              >
                                {f.name}
                                {floorAvailCount > 0 && (
                                  <span
                                    style={{
                                      marginLeft: "0.375rem",
                                      fontSize: "0.65rem",
                                      fontWeight: 700,
                                      background: isActive
                                        ? sc.color
                                        : "#e5e7eb",
                                      color: isActive ? "#fff" : "#6b7280",
                                      padding: "0.1rem 0.35rem",
                                      borderRadius: "999px",
                                    }}
                                  >
                                    {floorAvailCount}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Tables grid */}
                      {visibleTables.length === 0 ? (
                        <div
                          style={{
                            padding: "1.5rem",
                            textAlign: "center",
                            background: "#fafaf8",
                            borderRadius: "10px",
                          }}
                        >
                          <p style={{ fontSize: "0.875rem", color: "#9a9088" }}>
                            No tables in this section fit party of {partySize}
                          </p>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "0.5rem",
                            maxHeight: "220px",
                            overflowY: "auto",
                            paddingRight: "2px",
                          }}
                        >
                          {visibleTables.map((t) => {
                            const selected = selectedTableId === t.id;
                            return (
                              <button
                                key={t.id}
                                onClick={() =>
                                  t.available && setSelectedTableId(t.id)
                                }
                                disabled={!t.available}
                                style={{
                                  padding: "0.75rem 0.625rem",
                                  border: "2px solid",
                                  borderRadius: "10px",
                                  cursor: t.available
                                    ? "pointer"
                                    : "not-allowed",
                                  textAlign: "left",
                                  fontFamily: "inherit",
                                  transition: "all 0.15s",
                                  background: !t.available
                                    ? "#f8f8f7"
                                    : selected
                                      ? "#fef2ec"
                                      : "#ffffff",
                                  borderColor: !t.available
                                    ? "rgba(24,22,15,0.07)"
                                    : selected
                                      ? "#c4410c"
                                      : "rgba(24,22,15,0.12)",
                                  opacity: t.available ? 1 : 0.5,
                                  boxShadow: selected
                                    ? "0 0 0 3px rgba(196,65,12,0.15)"
                                    : "none",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                    marginBottom: "0.3rem",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "1rem",
                                      fontWeight: 700,
                                      color: !t.available
                                        ? "#c8c4be"
                                        : selected
                                          ? "#c4410c"
                                          : "#18160f",
                                    }}
                                  >
                                    T{t.label}
                                  </span>
                                  {t.isWindowSeat && (
                                    <span
                                      style={{
                                        fontSize: "0.55rem",
                                        background: "#eff6ff",
                                        color: "#2563eb",
                                        padding: "0.1rem 0.3rem",
                                        borderRadius: "999px",
                                        fontWeight: 600,
                                        marginTop: "1px",
                                      }}
                                    >
                                      ⬡
                                    </span>
                                  )}
                                </div>
                                <p
                                  style={{
                                    fontSize: "0.6875rem",
                                    color: "#9a9088",
                                    marginBottom: "0.2rem",
                                  }}
                                >
                                  {t.minCapacity === t.capacity
                                    ? `${t.capacity}p`
                                    : `${t.minCapacity}–${t.capacity}p`}
                                </p>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.2rem",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "5px",
                                      height: "5px",
                                      borderRadius: "50%",
                                      background: t.available
                                        ? "#16a34a"
                                        : "#9a9088",
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: "0.6rem",
                                      fontWeight: 600,
                                      color: t.available
                                        ? "#16a34a"
                                        : "#9a9088",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.03em",
                                    }}
                                  >
                                    {t.available ? "Free" : "Booked"}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {/* Notes */}
                  <div>
                    <label style={labelStyle}>
                      Notes{" "}
                      <span style={{ fontWeight: 400, color: "#9a9088" }}>
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Special requests, occasion, dietary needs…"
                      className="input"
                      style={{ resize: "none" }}
                    />
                  </div>

                  {/* Confirmed selection banner */}
                  {selectedTableId && (
                    <div
                      style={{
                        padding: "0.625rem 0.875rem",
                        background: "#f0fdf4",
                        border: "1px solid rgba(22,163,74,0.25)",
                        borderRadius: "8px",
                        fontSize: "0.8125rem",
                        color: "#16a34a",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span>✓</span>
                      <span>
                        Table{" "}
                        {
                          visibleTables.find((t) => t.id === selectedTableId)
                            ?.label
                        }{" "}
                        selected — booking will be confirmed immediately
                      </span>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.625rem" }}>
                    <button
                      onClick={() => setStep(2)}
                      className="btn btn-ghost btn-md"
                      style={{ flex: 1 }}
                    >
                      ← Back
                    </button>
                    <button
                      onClick={submit}
                      disabled={!selectedTableId || submitting}
                      className="btn btn-primary btn-md"
                      style={{
                        flex: 2,
                        opacity: !selectedTableId || submitting ? 0.55 : 1,
                      }}
                    >
                      {submitting ? "Booking…" : "Confirm booking"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8125rem",
  fontWeight: 600,
  color: "#5c5248",
  marginBottom: "0.375rem",
};

const counterBtn: React.CSSProperties = {
  width: "32px",
  height: "32px",
  border: "1px solid rgba(24,22,15,0.15)",
  borderRadius: "6px",
  background: "#fafaf8",
  color: "#18160f",
  fontSize: "1.125rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "inherit",
};
