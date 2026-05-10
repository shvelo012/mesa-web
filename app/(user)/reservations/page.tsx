"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Reservation } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-slate-100 text-slate-500",
  COMPLETED: "bg-blue-100 text-blue-700",
  NO_SHOW: "bg-red-100 text-red-700",
};

export default function MyReservationsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api.get("/reservations/my").then(({ data }) => setReservations(data)).finally(() => setLoading(false));
  }, [user]);

  async function cancel(id: string) {
    await api.patch(`/reservations/${id}/cancel`);
    setReservations((rs) => rs.map((r) => r.id === id ? { ...r, status: "CANCELLED" } : r));
  }

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href="/restaurants" className="text-xl font-bold text-slate-900">TablePro</Link>
        <button onClick={() => { logout(); router.push("/"); }} className="text-sm text-red-500">Sign Out</button>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Reservations</h1>

        {reservations.length === 0 && (
          <p className="text-slate-400">No reservations yet. <Link href="/restaurants" className="text-blue-600 hover:underline">Find a table</Link>.</p>
        )}

        <div className="space-y-3">
          {reservations.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-900">{r.date} · {r.startTime}–{r.endTime}</p>
                <p className="text-sm text-slate-500">Table: {r.table?.label} · {r.partySize} people</p>
                {r.notes && <p className="text-sm text-slate-400">{r.notes}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] || ""}`}>
                  {r.status}
                </span>
                {r.status === "PENDING" && (
                  <button
                    onClick={() => cancel(r.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
