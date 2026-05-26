"use client";

import { useTranslation } from "react-i18next";

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  PENDING:   { bg: "#fffbeb", text: "#b45309" },
  CONFIRMED: { bg: "#f0fdf4", text: "#16a34a" },
  CANCELLED: { bg: "#f8f8f7", text: "#9a9088" },
  COMPLETED: { bg: "#eff6ff", text: "#2563eb" },
  NO_SHOW:   { bg: "#fef2f2", text: "#dc2626" },
};

type Reservation = {
  id: string;
  date: string;
  startTime: string;
  partySize: number;
  status: string;
  guestName?: string;
  user?: { name: string };
  table?: { label: string };
  tableId?: string;
};

interface Props {
  reservations: Reservation[];
  date: string;
  openTime: string;
  closeTime: string;
  onAction?: (id: string, status: string) => void;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function generateSlots(open: string, close: string, step = 60): string[] {
  const slots: string[] = [];
  let m = timeToMinutes(open);
  const end = timeToMinutes(close);
  while (m <= end) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
    m += step;
  }
  return slots;
}

export default function TimelineView({ reservations, date, openTime, closeTime, onAction }: Props) {
  const { t } = useTranslation();
  const open = timeToMinutes(openTime);
  const close = timeToMinutes(closeTime);
  const totalMins = close - open;
  const slots = generateSlots(openTime, closeTime, 60);

  // Group reservations by tableId, deduplicate tables
  const tableMap = new Map<string, { label: string; reservations: Reservation[] }>();
  for (const r of reservations) {
    if (!r.tableId) continue;
    if (!tableMap.has(r.tableId)) {
      tableMap.set(r.tableId, { label: r.table?.label || r.tableId.slice(0, 6), reservations: [] });
    }
    tableMap.get(r.tableId)!.reservations.push(r);
  }

  const tables = [...tableMap.entries()];

  const now = new Date();
  const isToday = date === now.toISOString().split("T")[0];
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const nowPct = isToday ? Math.max(0, Math.min(100, ((nowMins - open) / totalMins) * 100)) : null;

  if (!tables.length) {
    return (
      <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
        <p style={{ fontSize: "1rem", fontWeight: 600, color: "#18160f", marginBottom: "0.25rem" }}>{t("timeline.noReservations")}</p>
        <p style={{ fontSize: "0.875rem", color: "#9a9088" }}>{date}</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: "700px", padding: "0.75rem 1.5rem 1.5rem" }}>
        {/* Time header */}
        <div style={{ display: "flex", marginLeft: "90px", marginBottom: "0.5rem", position: "relative" }}>
          {slots.map((slot, i) => (
            <div
              key={slot}
              style={{
                flex: i < slots.length - 1 ? 1 : 0,
                fontSize: "0.7rem",
                color: "#9a9088",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {slot}
            </div>
          ))}
        </div>

        {/* Table rows */}
        {tables.map(([tableId, { label, reservations: tableResv }]) => {
          const sorted = [...tableResv].sort((a, b) => a.startTime.localeCompare(b.startTime));
          return (
          <div key={tableId} style={{ display: "flex", alignItems: "center", marginBottom: "6px", gap: "8px" }}>
            <div style={{ width: "82px", flexShrink: 0, fontSize: "0.75rem", fontWeight: 600, color: "#5c5248", textAlign: "right", paddingRight: "8px" }}>
              T{label}
            </div>
            <div style={{ flex: 1, height: "36px", background: "#f0ede8", borderRadius: "6px", position: "relative", overflow: "hidden" }}>
              {nowPct !== null && (
                <div style={{ position: "absolute", top: 0, bottom: 0, left: `${nowPct}%`, width: "1.5px", background: "#c4410c", zIndex: 10, opacity: 0.7 }} />
              )}
              {sorted.map((r, idx) => {
                const start = timeToMinutes(r.startTime);
                const effectiveEnd = idx + 1 < sorted.length ? timeToMinutes(sorted[idx + 1].startTime) : close;
                const leftPct = ((start - open) / totalMins) * 100;
                const widthPct = ((effectiveEnd - start) / totalMins) * 100;
                const cs = STATUS_COLOR[r.status] || STATUS_COLOR.PENDING;
                const name = r.user?.name || r.guestName || "Guest";
                return (
                  <div
                    key={r.id}
                    title={`${name} · ${r.startTime} · ${r.partySize}p`}
                    style={{
                      position: "absolute",
                      top: "3px",
                      bottom: "3px",
                      left: `${Math.max(0, leftPct)}%`,
                      width: `${Math.max(1, widthPct)}%`,
                      background: cs.bg,
                      border: `1px solid ${cs.text}40`,
                      borderRadius: "4px",
                      overflow: "hidden",
                      cursor: onAction ? "pointer" : "default",
                    }}
                  >
                    <div style={{ padding: "2px 6px", display: "flex", alignItems: "center", gap: "4px", height: "100%" }}>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: cs.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
