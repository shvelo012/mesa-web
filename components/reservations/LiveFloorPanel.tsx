"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useTranslation } from "react-i18next";

type TableLive = {
  id: string;
  label: string;
  capacity: number;
  status: "AVAILABLE" | "ARRIVING_SOON" | "OCCUPIED" | "UPCOMING";
  reservation?: { id: string; startTime: string; guestName: string | null; partySize: number };
};

type FloorLive = {
  id: string;
  name: string;
  sectionType: string;
  tables: TableLive[];
};

const STATUS_UI = {
  AVAILABLE:    { bg: "#f0fdf4", border: "#a8d5b8", color: "#16a34a", dot: "#16a34a", label: "Available" },
  ARRIVING_SOON:{ bg: "#fffbeb", border: "#f6c962", color: "#b45309", dot: "#f59e0b", label: "Arriving soon" },
  OCCUPIED:     { bg: "#fef2f2", border: "#fca5a5", color: "#dc2626", dot: "#dc2626", label: "Occupied" },
  UPCOMING:     { bg: "#eff6ff", border: "#93c5fd", color: "#2563eb", dot: "#2563eb", label: "Upcoming" },
};

interface Props {
  date: string;
  onTableClick?: (tableId: string) => void;
}

export default function LiveFloorPanel({ date, onTableClick }: Props) {
  const { t } = useTranslation();
  const [floors, setFloors] = useState<FloorLive[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get<FloorLive[]>(`/floors/restaurant/live?date=${date}`);
      setFloors(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30_000);
    return () => clearInterval(interval);
  }, [fetch]);

  if (loading) {
    return (
      <div style={{ padding: "2rem", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "24px", height: "24px", border: "2px solid #f0ede8", borderTopColor: "#c4410c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const legend = Object.entries(STATUS_UI).map(([k, v]) => ({ key: k, ...v }));

  return (
    <div>
      <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(24,22,15,0.07)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {legend.map((l) => (
            <span key={l.key} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", color: "#5c5248" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.dot, flexShrink: 0 }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: "0.75rem 1rem", overflowY: "auto", maxHeight: "calc(100vh - 300px)" }}>
        {floors.map((floor) => (
          <div key={floor.id} style={{ marginBottom: "1.25rem" }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
              {floor.name}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: "0.375rem" }}>
              {floor.tables.map((t) => {
                const s = STATUS_UI[t.status];
                return (
                  <button
                    key={t.id}
                    onClick={() => onTableClick?.(t.id)}
                    title={t.reservation
                      ? `${t.reservation.guestName || "Guest"} · ${t.reservation.startTime} · ${t.reservation.partySize}p`
                      : `Table ${t.label} · ${t.capacity} seats`
                    }
                    style={{
                      background: s.bg,
                      border: `1px solid ${s.border}`,
                      borderRadius: "6px",
                      padding: "0.375rem 0.25rem",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "transform 0.1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    <p style={{ fontSize: "0.75rem", fontWeight: 700, color: s.color, margin: 0 }}>T{t.label}</p>
                    {t.reservation && (
                      <p style={{ fontSize: "0.6rem", color: s.color, margin: "1px 0 0", lineHeight: 1.2 }}>
                        {t.reservation.startTime}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {floors.length === 0 && (
          <p style={{ fontSize: "0.875rem", color: "#9a9088", textAlign: "center", padding: "1rem 0" }}>
            {t("liveFloor.noFloors")}
          </p>
        )}
      </div>
    </div>
  );
}
