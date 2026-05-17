"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

type ConfirmationData = {
  id: string;
  confirmationToken: string;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  status: string;
  notes?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  tableLabel?: string;
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
};

const STATUS_UI: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  PENDING:   { label: "Pending review", bg: "#fffbeb", color: "#b45309", icon: "⏳" },
  CONFIRMED: { label: "Confirmed",       bg: "#f0fdf4", color: "#16a34a", icon: "✓" },
  CANCELLED: { label: "Cancelled",       bg: "#fef2f2", color: "#dc2626", icon: "✕" },
  COMPLETED: { label: "Completed",       bg: "#eff6ff", color: "#2563eb", icon: "✓" },
  NO_SHOW:   { label: "No-show",         bg: "#f8f8f7", color: "#9a9088", icon: "○" },
  SEATED:    { label: "Seated",          bg: "#f5f3ff", color: "#7c3aed", icon: "✓" },
};

function buildCalendarUrl(r: ConfirmationData): string {
  const [y, mo, d] = r.date.split("-");
  const [sh, sm] = r.startTime.split(":");
  const [eh, em] = r.endTime ? r.endTime.split(":") : [String(+sh + 2), "00"];
  const start = `${y}${mo}${d}T${sh}${sm}00`;
  const end = `${y}${mo}${d}T${eh}${em}00`;
  const title = encodeURIComponent(`Reservation at ${r.restaurantName || "Restaurant"}`);
  const loc = encodeURIComponent(r.restaurantAddress || "");
  const details = encodeURIComponent(`Table ${r.tableLabel || "?"} · ${r.partySize} guest${r.partySize > 1 ? "s" : ""}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&location=${loc}&details=${details}`;
}

function buildIcs(r: ConfirmationData): string {
  const [y, mo, d] = r.date.split("-");
  const [sh, sm] = r.startTime.split(":");
  const [eh, em] = r.endTime ? r.endTime.split(":") : [String(+sh + 2), "00"];
  const dtStart = `${y}${mo}${d}T${sh}${sm}00`;
  const dtEnd = `${y}${mo}${d}T${eh}${em}00`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Reservation at ${r.restaurantName || "Restaurant"}`,
    `LOCATION:${r.restaurantAddress || ""}`,
    `DESCRIPTION:Table ${r.tableLabel || "?"} · ${r.partySize} guests`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadIcs(r: ConfirmationData) {
  const blob = new Blob([buildIcs(r)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reservation-${r.date}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function QRCode({ value, size = 160 }: { value: string; size?: number }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(value)}&size=${size}x${size}&margin=1&color=18160f&bgcolor=ffffff`;
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={url}
      alt="Reservation QR code"
      width={size}
      height={size}
      style={{ borderRadius: "8px", display: "block" }}
    />
  );
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function ReservationConfirmationPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [data, setData] = useState<ConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    api.get(`/reservations/confirm/${token}`)
      .then(({ data: d }) => setData(d))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleCancel() {
    if (!window.confirm("Cancel your reservation?")) return;
    setCancelling(true);
    try {
      await api.patch(`/reservations/confirm/${token}/cancel`);
      setCancelled(true);
      setData((d) => d ? { ...d, status: "CANCELLED" } : d);
    } catch {
      alert("Could not cancel — please contact the restaurant directly.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f3ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid #f0ede8", borderTopColor: "#c4410c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f3ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.75rem", opacity: 0.4 }}>🔍</p>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#18160f", marginBottom: "0.5rem" }}>Reservation not found</h2>
          <p style={{ fontSize: "0.875rem", color: "#9a9088", marginBottom: "1.5rem" }}>This link may have expired or the reservation was removed.</p>
          <Link href="/restaurants" className="btn btn-primary btn-md" style={{ textDecoration: "none" }}>Browse restaurants</Link>
        </div>
      </div>
    );
  }

  const ui = STATUS_UI[data.status] || STATUS_UI.PENDING;
  const canCancel = (data.status === "PENDING" || data.status === "CONFIRMED") && !cancelled;
  const isConfirmed = data.status === "CONFIRMED";
  const isPending = data.status === "PENDING";
  const confirmationUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ef" }}>
      <nav className="nav">
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => router.push("/restaurants")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9088", fontSize: "0.875rem", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            ← Restaurants
          </button>
          <div style={{ width: "1px", height: "16px", background: "rgba(24,22,15,0.1)" }} />
          <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>mesa</span>
        </div>
      </nav>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        {/* Status hero */}
        <div
          className="anim-1"
          style={{
            opacity: 0,
            textAlign: "center",
            padding: "2.5rem 2rem",
            background: ui.bg,
            border: `1px solid ${ui.color}25`,
            borderRadius: "16px",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ fontSize: "2.75rem", marginBottom: "0.625rem", lineHeight: 1 }}>{ui.icon}</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#18160f", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
            {isPending ? "Request received!" : isConfirmed ? "You\'re confirmed!" : `Reservation ${ui.label}`}
          </h1>
          <p style={{ fontSize: "0.9375rem", color: ui.color, fontWeight: 600, margin: 0 }}>{ui.label}</p>
          {isPending && (
            <p style={{ fontSize: "0.875rem", color: "#5c5248", marginTop: "0.625rem", maxWidth: "380px", margin: "0.625rem auto 0" }}>
              The restaurant will review and confirm. You&apos;ll receive an email update.
            </p>
          )}
          {isConfirmed && (
            <p style={{ fontSize: "0.875rem", color: "#5c5248", marginTop: "0.625rem" }}>
              Show this page or the QR code at the restaurant.
            </p>
          )}
        </div>

        {/* Main card: details + QR */}
        <div className="card anim-2" style={{ opacity: 0, marginBottom: "1rem", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: isConfirmed ? "1fr auto" : "1fr", gap: 0 }}>

            {/* Details */}
            <div style={{ padding: "1.75rem" }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.25rem" }}>
                Booking details
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                {data.restaurantName && (
                  <div style={{ gridColumn: "span 2" }}>
                    <p style={{ fontSize: "0.75rem", color: "#9a9088", marginBottom: "0.2rem" }}>Restaurant</p>
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "#18160f" }}>{data.restaurantName}</p>
                    {data.restaurantAddress && <p style={{ fontSize: "0.8125rem", color: "#5c5248" }}>{data.restaurantAddress}</p>}
                  </div>
                )}
                <div>
                  <p style={{ fontSize: "0.75rem", color: "#9a9088", marginBottom: "0.2rem" }}>Date</p>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#18160f" }}>{formatDate(data.date)}</p>
                </div>
                <div>
                  <p style={{ fontSize: "0.75rem", color: "#9a9088", marginBottom: "0.2rem" }}>Time</p>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#18160f" }}>{data.startTime} – {data.endTime}</p>
                </div>
                <div>
                  <p style={{ fontSize: "0.75rem", color: "#9a9088", marginBottom: "0.2rem" }}>Party size</p>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#18160f" }}>{data.partySize} guest{data.partySize > 1 ? "s" : ""}</p>
                </div>
                {data.tableLabel && (
                  <div>
                    <p style={{ fontSize: "0.75rem", color: "#9a9088", marginBottom: "0.2rem" }}>Table</p>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#18160f" }}>Table {data.tableLabel}</p>
                  </div>
                )}
                {data.guestName && (
                  <div>
                    <p style={{ fontSize: "0.75rem", color: "#9a9088", marginBottom: "0.2rem" }}>Name</p>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#18160f" }}>{data.guestName}</p>
                  </div>
                )}
                {data.notes && (
                  <div style={{ gridColumn: "span 2" }}>
                    <p style={{ fontSize: "0.75rem", color: "#9a9088", marginBottom: "0.2rem" }}>Special requests</p>
                    <p style={{ fontSize: "0.875rem", color: "#5c5248", fontStyle: "italic" }}>&quot;{data.notes}&quot;</p>
                  </div>
                )}
              </div>
            </div>

            {/* QR code — only for confirmed */}
            {isConfirmed && (
              <div style={{ padding: "1.75rem", borderLeft: "1px solid rgba(24,22,15,0.07)", background: "#fafaf8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                <QRCode value={confirmationUrl} size={140} />
                <p style={{ fontSize: "0.7rem", color: "#9a9088", textAlign: "center", maxWidth: "120px" }}>Show at the restaurant</p>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="anim-3" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {canCancel && (
            <>
              {/* Add to calendar options */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                <a
                  href={buildCalendarUrl(data)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    background: "#ffffff",
                    border: "1px solid rgba(24,22,15,0.12)",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#18160f",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Google Calendar
                </a>
                <button
                  onClick={() => downloadIcs(data)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    background: "#ffffff",
                    border: "1px solid rgba(24,22,15,0.12)",
                    borderRadius: "10px",
                    fontFamily: "inherit",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#18160f",
                    cursor: "pointer",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18160f" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Apple / .ics
                </button>
              </div>

              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{ padding: "0.75rem 1rem", background: "transparent", color: "#9a9088", border: "1px solid rgba(24,22,15,0.12)", borderRadius: "10px", fontFamily: "inherit", fontSize: "0.875rem", cursor: cancelling ? "not-allowed" : "pointer" }}
              >
                {cancelling ? "Cancelling…" : "Cancel reservation"}
              </button>
            </>
          )}

          <Link href="/restaurants" style={{ textDecoration: "none" }}>
            <button style={{ width: "100%", padding: "0.75rem 1rem", background: "#f5f3ef", color: "#5c5248", border: "none", borderRadius: "10px", fontFamily: "inherit", fontSize: "0.875rem", cursor: "pointer", fontWeight: 500 }}>
              Browse more restaurants
            </button>
          </Link>
        </div>

        {data.restaurantPhone && (
          <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "#9a9088", marginTop: "1.5rem" }}>
            Questions? <a href={`tel:${data.restaurantPhone}`} style={{ color: "#c4410c" }}>{data.restaurantName} · {data.restaurantPhone}</a>
          </p>
        )}
      </div>
    </div>
  );
}
