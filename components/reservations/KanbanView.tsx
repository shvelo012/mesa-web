"use client";

import { useTranslation } from "react-i18next";

function sameSlot(a: ReservationItem, b: ReservationItem) {
  return a.tableId && a.tableId === b.tableId && a.date === b.date && a.startTime === b.startTime;
}

function getConfirmedConflictIds(reservations: ReservationItem[]): Set<string> {
  const confirmed = reservations.filter((r) => r.status === "CONFIRMED");
  const ids = new Set<string>();
  for (const p of reservations.filter((r) => r.status === "PENDING")) {
    for (const c of confirmed) {
      if (sameSlot(p, c)) ids.add(p.id);
    }
  }
  return ids;
}

function getConflictIds(reservations: ReservationItem[]): Set<string> {
  const active = reservations.filter((r) => r.status === "PENDING" || r.status === "CONFIRMED");
  const ids = new Set<string>();
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j];
      if (sameSlot(a, b)) { ids.add(a.id); ids.add(b.id); }
    }
  }
  return ids;
}

type ReservationItem = {
  id: string;
  date: string;
  startTime: string;
  partySize: number;
  status: string;
  notes?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  user?: { name: string; email: string; phone?: string };
  tableId?: string;
  table?: { label: string };
};

const COLUMN_STYLES: Record<string, { bg: string; border: string; badgeBg: string; badgeColor: string }> = {
  PENDING:   { bg: "#fffbeb", border: "rgba(180,83,9,0.2)",   badgeBg: "#fef3c7", badgeColor: "#b45309" },
  CONFIRMED: { bg: "#f0fdf4", border: "rgba(22,163,74,0.2)",  badgeBg: "#dcfce7", badgeColor: "#16a34a" },
  SEATED:    { bg: "#f5f3ff", border: "rgba(124,58,237,0.2)", badgeBg: "#ede9fe", badgeColor: "#7c3aed" },
  COMPLETED: { bg: "#eff6ff", border: "rgba(37,99,235,0.2)",  badgeBg: "#dbeafe", badgeColor: "#2563eb" },
};

const COLUMN_STATUSES = ["PENDING", "CONFIRMED", "SEATED", "COMPLETED"];

const NEXT_STATUS_CONFIG: Record<string, { status: string; bg: string; color: string; tKey: string }[]> = {
  PENDING:   [
    { status: "CONFIRMED", bg: "#16a34a", color: "#fff", tKey: "manageReservations.accept" },
    { status: "CANCELLED", bg: "#fef2f2", color: "#dc2626", tKey: "manageReservations.decline" },
  ],
  CONFIRMED: [
    { status: "SEATED",    bg: "#7c3aed", color: "#fff", tKey: "manageReservations.seat" },
    { status: "CANCELLED", bg: "#f5f3ef", color: "#9a9088", tKey: "manageReservations.cancelAction" },
  ],
  SEATED:    [
    { status: "COMPLETED", bg: "#2563eb", color: "#fff", tKey: "manageReservations.complete" },
    { status: "CANCELLED", bg: "#f5f3ef", color: "#9a9088", tKey: "manageReservations.cancelAction" },
  ],
  COMPLETED: [],
};

interface Props {
  reservations: ReservationItem[];
  onStatusChange: (id: string, status: string) => void;
  actionLoading: string | null;
  canWrite: boolean;
  onGuestClick?: (email: string, name: string) => void;
}

export default function KanbanView({ reservations, onStatusChange, actionLoading, canWrite, onGuestClick }: Props) {
  const { t } = useTranslation();
  const busy = !!actionLoading;
  const conflictIds = getConflictIds(reservations);
  const confirmedConflictIds = getConfirmedConflictIds(reservations);

  const COLUMN_LABELS: Record<string, string> = {
    PENDING:   t("kanban.pending"),
    CONFIRMED: t("kanban.confirmed"),
    SEATED:    t("kanban.seated"),
    COMPLETED: t("reservations.status.COMPLETED"),
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", padding: "1.25rem", minHeight: "400px", alignItems: "start" }}>
      {COLUMN_STATUSES.map((status) => {
        const col = COLUMN_STYLES[status];
        const label = COLUMN_LABELS[status];
        const cards = reservations.filter((r) => r.status === status);
        return (
          <div key={status}>
            {/* Column header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: col.badgeColor, background: col.badgeBg, padding: "0.2rem 0.625rem", borderRadius: "999px" }}>
                {label}
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9a9088" }}>
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {cards.length === 0 && (
                <div style={{ padding: "1.5rem 1rem", background: "rgba(24,22,15,0.02)", border: "2px dashed rgba(24,22,15,0.08)", borderRadius: "8px", textAlign: "center" }}>
                  <p style={{ fontSize: "0.8125rem", color: "#c8c4be" }}>{t(`kanban.no${status.charAt(0) + status.slice(1).toLowerCase()}` as never) || `No ${label.toLowerCase()}`}</p>
                </div>
              )}
              {cards.map((r) => {
                const name = r.user?.name || r.guestName || "Guest";
                const email = r.user?.email || r.guestEmail || "";
                const actions = canWrite ? (NEXT_STATUS_CONFIG[r.status] || []) : [];
                const isLoading = actionLoading?.startsWith(r.id);
                const acceptBlocked = r.status === "PENDING" && confirmedConflictIds.has(r.id);

                return (
                  <div
                    key={r.id}
                    style={{
                      background: r.status === "PENDING" && conflictIds.has(r.id) ? "#fff8f8" : "#ffffff",
                      border: `1px solid ${r.status === "PENDING" && conflictIds.has(r.id) ? "rgba(220,38,38,0.35)" : col.border}`,
                      borderRadius: "8px",
                      padding: "0.875rem 1rem",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: 0 }}>
                      <button
                        onClick={() => email && onGuestClick && onGuestClick(email, name)}
                        style={{ background: "none", border: "none", padding: 0, cursor: email ? "pointer" : "default", fontFamily: "inherit", textAlign: "left", flex: 1, minWidth: 0 }}
                      >
                        <p style={{ fontSize: "0.875rem", fontWeight: 700, color: email ? "#c4410c" : "#18160f", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: email ? "underline" : "none" }}>
                          {name}
                        </p>
                      </button>
                      {r.status === "PENDING" && conflictIds.has(r.id) && (
                        <span title={t("manageReservations.tableAlreadyConfirmed")} style={{ flexShrink: 0, fontSize: "0.6875rem", fontWeight: 700, color: "#dc2626", background: "#fee2e2", border: "1px solid rgba(220,38,38,0.25)", padding: "0.1rem 0.4rem", borderRadius: "4px", lineHeight: 1.4 }}>
                          {t("manageReservations.conflict")}
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: "0.375rem", display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#5c5248", background: "#f5f3ef", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>{r.date}</span>
                      <span style={{ fontSize: "0.75rem", color: "#5c5248", background: "#f5f3ef", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>{r.startTime}</span>
                      {r.table && (
                        <span style={{ fontSize: "0.75rem", color: "#5c5248", background: "#f5f3ef", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>T{r.table.label}</span>
                      )}
                      <span style={{ fontSize: "0.75rem", color: "#5c5248", background: "#f5f3ef", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>{r.partySize}p</span>
                    </div>

                    {r.notes && (
                      <p style={{ fontSize: "0.7rem", color: "#9a9088", marginTop: "0.375rem", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        &quot;{r.notes}&quot;
                      </p>
                    )}

                    {actions.length > 0 && (
                      <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.625rem", flexWrap: "wrap" }}>
                        {actions.map((a) => {
                          const isAccept = a.status === "CONFIRMED";
                          const blocked = isAccept && acceptBlocked;
                          return (
                            <button
                              key={a.status}
                              onClick={() => onStatusChange(r.id, a.status)}
                              disabled={busy || blocked}
                              title={blocked ? t("manageReservations.tableAlreadyConfirmed") : undefined}
                              style={{
                                flex: 1,
                                padding: "0.3rem 0.5rem",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                fontFamily: "inherit",
                                border: "none",
                                borderRadius: "5px",
                                cursor: (busy || blocked) ? "not-allowed" : "pointer",
                                background: a.bg,
                                color: a.color,
                                opacity: (isLoading || blocked) ? 0.4 : 1,
                                transition: "opacity 0.15s",
                              }}
                            >
                              {isLoading && actionLoading === r.id + a.status ? "…" : t(a.tKey as never)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
