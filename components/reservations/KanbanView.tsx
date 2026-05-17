"use client";

type ReservationItem = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
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

const COLUMNS: { status: string; label: string; bg: string; border: string; badgeBg: string; badgeColor: string }[] = [
  { status: "PENDING",   label: "Pending",   bg: "#fffbeb", border: "rgba(180,83,9,0.2)",   badgeBg: "#fef3c7", badgeColor: "#b45309" },
  { status: "CONFIRMED", label: "Confirmed", bg: "#f0fdf4", border: "rgba(22,163,74,0.2)",  badgeBg: "#dcfce7", badgeColor: "#16a34a" },
  { status: "SEATED",    label: "Seated",    bg: "#f5f3ff", border: "rgba(124,58,237,0.2)", badgeBg: "#ede9fe", badgeColor: "#7c3aed" },
  { status: "COMPLETED", label: "Completed", bg: "#eff6ff", border: "rgba(37,99,235,0.2)",  badgeBg: "#dbeafe", badgeColor: "#2563eb" },
];

const NEXT_STATUS: Record<string, { label: string; status: string; bg: string; color: string }[]> = {
  PENDING:   [
    { label: "Accept",  status: "CONFIRMED", bg: "#16a34a", color: "#fff" },
    { label: "Decline", status: "CANCELLED", bg: "#fef2f2", color: "#dc2626" },
  ],
  CONFIRMED: [
    { label: "Seat",   status: "SEATED",    bg: "#7c3aed", color: "#fff" },
    { label: "Cancel", status: "CANCELLED", bg: "#f5f3ef", color: "#9a9088" },
  ],
  SEATED:    [
    { label: "Complete", status: "COMPLETED", bg: "#2563eb", color: "#fff" },
    { label: "Cancel",   status: "CANCELLED", bg: "#f5f3ef", color: "#9a9088" },
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
  const busy = !!actionLoading;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", padding: "1.25rem", minHeight: "400px", alignItems: "start" }}>
      {COLUMNS.map((col) => {
        const cards = reservations.filter((r) => r.status === col.status);
        return (
          <div key={col.status}>
            {/* Column header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: col.badgeColor, background: col.badgeBg, padding: "0.2rem 0.625rem", borderRadius: "999px" }}>
                {col.label}
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9a9088" }}>
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {cards.length === 0 && (
                <div style={{ padding: "1.5rem 1rem", background: "rgba(24,22,15,0.02)", border: "2px dashed rgba(24,22,15,0.08)", borderRadius: "8px", textAlign: "center" }}>
                  <p style={{ fontSize: "0.8125rem", color: "#c8c4be" }}>No {col.label.toLowerCase()} reservations</p>
                </div>
              )}
              {cards.map((r) => {
                const name = r.user?.name || r.guestName || "Guest";
                const email = r.user?.email || r.guestEmail || "";
                const actions = canWrite ? (NEXT_STATUS[r.status] || []) : [];
                const isLoading = actionLoading?.startsWith(r.id);

                return (
                  <div
                    key={r.id}
                    style={{
                      background: "#ffffff",
                      border: `1px solid ${col.border}`,
                      borderRadius: "8px",
                      padding: "0.875rem 1rem",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Guest name */}
                    <button
                      onClick={() => email && onGuestClick && onGuestClick(email, name)}
                      style={{ background: "none", border: "none", padding: 0, cursor: email ? "pointer" : "default", fontFamily: "inherit", textAlign: "left", width: "100%" }}
                    >
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: email ? "#c4410c" : "#18160f", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: email ? "underline" : "none" }}>
                        {name}
                      </p>
                    </button>

                    {/* Meta */}
                    <div style={{ marginTop: "0.375rem", display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#5c5248", background: "#f5f3ef", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
                        {r.date}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#5c5248", background: "#f5f3ef", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
                        {r.startTime}–{r.endTime}
                      </span>
                      {r.table && (
                        <span style={{ fontSize: "0.75rem", color: "#5c5248", background: "#f5f3ef", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
                          T{r.table.label}
                        </span>
                      )}
                      <span style={{ fontSize: "0.75rem", color: "#5c5248", background: "#f5f3ef", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
                        {r.partySize}p
                      </span>
                    </div>

                    {r.notes && (
                      <p style={{ fontSize: "0.7rem", color: "#9a9088", marginTop: "0.375rem", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        &quot;{r.notes}&quot;
                      </p>
                    )}

                    {/* Actions */}
                    {actions.length > 0 && (
                      <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.625rem", flexWrap: "wrap" }}>
                        {actions.map((a) => (
                          <button
                            key={a.status}
                            onClick={() => onStatusChange(r.id, a.status)}
                            disabled={busy}
                            style={{
                              flex: 1,
                              padding: "0.3rem 0.5rem",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              fontFamily: "inherit",
                              border: "none",
                              borderRadius: "5px",
                              cursor: busy ? "not-allowed" : "pointer",
                              background: a.bg,
                              color: a.color,
                              opacity: isLoading ? 0.65 : 1,
                              transition: "opacity 0.15s",
                            }}
                          >
                            {isLoading && actionLoading === r.id + a.status ? "…" : a.label}
                          </button>
                        ))}
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
