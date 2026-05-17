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
};

function buildCalendarUrl(r: ConfirmationData): string {
  const [y, mo, d] = r.date.split("-");
  const [sh, sm] = r.startTime.split(":");
  const [eh, em] = r.endTime.split(":");
  const start = `${y}${mo}${d}T${sh}${sm}00`;
  const end = `${y}${mo}${d}T${eh}${em}00`;
  const title = encodeURIComponent(`Dinner at ${r.restaurantName || "Restaurant"}`);
  const loc = encodeURIComponent(r.restaurantAddress || "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&location=${loc}`;
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
          <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔍</p>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#18160f", marginBottom: "0.5rem" }}>Reservation not found</h2>
          <p style={{ fontSize: "0.875rem", color: "#9a9088", marginBottom: "1.5rem" }}>This link may have expired or the reservation was removed.</p>
          <Link href="/restaurants" className="btn btn-primary btn-md" style={{ textDecoration: "none" }}>Browse restaurants</Link>
        </div>
      </div>
    );
  }

  const ui = STATUS_UI[data.status] || STATUS_UI.PENDING;
  const canCancel = data.status === "PENDING" || data.status === "CONFIRMED";

  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ef" }}>
      <nav className="nav">
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", gap: "1rem" }}>
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

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* Status banner */}
        <div
          className="anim-1"
          style={{ textAlign: "center", padding: "2rem 1.5rem", background: ui.bg, border: `1px solid ${ui.color}30`, borderRadius: "16px", marginBottom: "1.5rem", opacity: 0 }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{ui.icon}</div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#18160f", marginBottom: "0.25rem" }}>
            {data.status === "PENDING" ? "Reservation request sent!" : `Reservation ${ui.label}`}
          </h1>
          <p style={{ fontSize: "0.9375rem", color: ui.color, fontWeight: 600, margin: 0 }}>{ui.label}</p>
          {data.status === "PENDING" && (
            <p style={{ fontSize: "0.875rem", color: "#5c5248", marginTop: "0.5rem" }}>
              The restaurant will review and confirm your booking. You&apos;ll receive an email update.
            </p>
          )}
        </div>

        {/* Details card */}
        <div className="card anim-2" style={{ padding: "1.5rem", marginBottom: "1rem", opacity: 0 }}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
            Booking details
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { label: "Restaurant", value: data.restaurantName },
              { label: "Date", value: data.date },
              { label: "Time", value: `${data.startTime} – ${data.endTime}` },
              { label: "Party size", value: `${data.partySize} guest${data.partySize > 1 ? "s" : ""}` },
              { label: "Table", value: data.tableLabel ? `Table ${data.tableLabel}` : null },
              { label: "Address", value: data.restaurantAddress },
              { label: "Name", value: data.guestName },
              { label: "Notes", value: data.notes || null },
            ].filter((row) => row.value).map(({ label, value }) => (
              <div key={label} style={{ display: "flex", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.8125rem", color: "#9a9088", width: "90px", flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: "0.875rem", color: "#18160f", fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="anim-3" style={{ display: "flex", flexDirection: "column", gap: "0.625rem", opacity: 0 }}>
          {canCancel && !cancelled && (
            <a
              href={buildCalendarUrl(data)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-md"
              style={{ textDecoration: "none", justifyContent: "center", width: "100%" }}
            >
              📅 Add to Google Calendar
            </a>
          )}

          {canCancel && !cancelled && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              style={{ padding: "0.625rem 1rem", background: "transparent", color: "#9a9088", border: "1px solid rgba(24,22,15,0.12)", borderRadius: "8px", fontFamily: "inherit", fontSize: "0.875rem", cursor: cancelling ? "not-allowed" : "pointer" }}
            >
              {cancelling ? "Cancelling…" : "Cancel reservation"}
            </button>
          )}

          <Link href="/restaurants" style={{ textDecoration: "none" }}>
            <button style={{ width: "100%", padding: "0.625rem 1rem", background: "#f5f3ef", color: "#5c5248", border: "none", borderRadius: "8px", fontFamily: "inherit", fontSize: "0.875rem", cursor: "pointer", fontWeight: 500 }}>
              Browse more restaurants
            </button>
          </Link>
        </div>

        {data.restaurantPhone && (
          <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "#9a9088", marginTop: "1.25rem" }}>
            Questions? Call {data.restaurantName}: <a href={`tel:${data.restaurantPhone}`} style={{ color: "#c4410c" }}>{data.restaurantPhone}</a>
          </p>
        )}
      </div>
    </div>
  );
}
