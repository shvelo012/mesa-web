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
    if (!selectedTable) { setBookingErr("Select a table first"); return; }
    setBookingErr("");
    try {
      await api.post("/reservations", {
        tableId: selectedTable.id,
        ...booking,
        partySize: +booking.partySize,
      });
      setBookingMsg("Reservation made! Check My Reservations.");
      setSelectedTable(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setBookingErr(msg || "Booking failed");
    }
  }

  if (!restaurant) return <div className="p-8 text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{restaurant.name}</h1>
            <p className="text-sm text-slate-500">{restaurant.address} · {restaurant.openTime}–{restaurant.closeTime}</p>
          </div>
          <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-900">← Back</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 flex gap-6">
        <div className="flex-1 space-y-4">
          {(restaurant.floors || []).length > 1 && (
            <div className="flex gap-2">
              {(restaurant.floors || []).map((f: Floor) => (
                <button
                  key={f.id}
                  onClick={() => loadFloor(f.id)}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    selectedFloor?.id === f.id
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-slate-200 text-slate-700"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}

          {selectedFloor && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-3 border-b border-slate-100 text-sm text-slate-500">
                Click a table to select it for booking
              </div>
              <FloorViewCanvas
                floor={selectedFloor}
                selectedTableId={selectedTable?.id ?? null}
                onSelectTable={setSelectedTable}
              />
            </div>
          )}
        </div>

        <aside className="w-72 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Book a Table</h3>

            {selectedTable ? (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                {selectedTable.label} · {selectedTable.capacity} seats
                {selectedTable.isWindowSeat && " · Window seat"}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-3">No table selected</p>
            )}

            {bookingMsg && <div className="mb-3 p-2 bg-green-50 text-green-700 rounded text-sm">{bookingMsg}</div>}
            {bookingErr && <div className="mb-3 p-2 bg-red-50 text-red-700 rounded text-sm">{bookingErr}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Date</label>
                <input
                  type="date"
                  value={booking.date}
                  onChange={(e) => setBooking((b) => ({ ...b, date: e.target.value }))}
                  className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">From</label>
                  <input
                    type="time"
                    value={booking.startTime}
                    onChange={(e) => setBooking((b) => ({ ...b, startTime: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">To</label>
                  <input
                    type="time"
                    value={booking.endTime}
                    onChange={(e) => setBooking((b) => ({ ...b, endTime: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Party Size</label>
                <input
                  type="number"
                  min={1}
                  value={booking.partySize}
                  onChange={(e) => setBooking((b) => ({ ...b, partySize: +e.target.value }))}
                  className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Notes</label>
                <textarea
                  value={booking.notes}
                  onChange={(e) => setBooking((b) => ({ ...b, notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <button
                onClick={handleBook}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Book Now
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
