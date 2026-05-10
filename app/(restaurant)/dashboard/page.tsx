"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Restaurant, Floor } from "@/types";

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [newFloorName, setNewFloorName] = useState("");
  const [newFloorType, setNewFloorType] = useState("INDOOR");

  useEffect(() => {
    if (!user || user.role !== "RESTAURANT_OWNER") {
      router.push("/login");
      return;
    }
    fetchRestaurant();
  }, [user]);

  async function fetchRestaurant() {
    try {
      const { data } = await api.get("/restaurants/me");
      setRestaurant(data);
    } catch {
      // no restaurant yet
    } finally {
      setLoading(false);
    }
  }

  async function addFloor() {
    if (!newFloorName.trim()) return;
    const { data } = await api.post("/floors", {
      name: newFloorName,
      sectionType: newFloorType,
    });
    setRestaurant((r) => r ? { ...r, floors: [...(r.floors || []), data] } : r);
    setNewFloorName("");
  }

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Restaurant Dashboard</h1>
        <div className="flex gap-3">
          <span className="text-sm text-slate-500">{user?.name}</span>
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {!restaurant ? (
          <CreateRestaurantForm onCreated={setRestaurant} />
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-1">{restaurant.name}</h2>
              <p className="text-slate-500 text-sm">{restaurant.address}</p>
              <p className="text-slate-400 text-sm">{restaurant.openTime} – {restaurant.closeTime}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Floors & Sections</h3>

              <div className="space-y-2 mb-4">
                {(restaurant.floors || []).map((floor: Floor) => (
                  <div key={floor.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <span className="font-medium text-sm">{floor.name}</span>
                      <span className="ml-2 text-xs text-slate-400">{floor.sectionType}</span>
                    </div>
                    <Link
                      href={`/editor/${floor.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit Layout
                    </Link>
                  </div>
                ))}
                {!(restaurant.floors?.length) && (
                  <p className="text-slate-400 text-sm">No floors yet.</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  placeholder="Floor name (e.g. Main Hall)"
                  value={newFloorName}
                  onChange={(e) => setNewFloorName(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <select
                  value={newFloorType}
                  onChange={(e) => setNewFloorType(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2 py-2 text-sm"
                >
                  <option value="INDOOR">Indoor</option>
                  <option value="OUTDOOR">Outdoor</option>
                  <option value="BAR">Bar</option>
                  <option value="PRIVATE">Private</option>
                </select>
                <button
                  onClick={addFloor}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Reservations</h3>
              <ReservationList />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CreateRestaurantForm({ onCreated }: { onCreated: (r: Restaurant) => void }) {
  const [form, setForm] = useState({
    name: "", description: "", address: "", phone: "",
    email: "", cuisine: "", openTime: "09:00", closeTime: "22:00",
  });
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data } = await api.post("/restaurants", form);
      onCreated(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Failed to create restaurant");
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Set Up Your Restaurant</h2>
      {error && <div className="mb-3 p-2 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        {[
          { key: "name", label: "Name" },
          { key: "address", label: "Address" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "cuisine", label: "Cuisine" },
          { key: "openTime", label: "Opens", type: "time" },
          { key: "closeTime", label: "Closes", type: "time" },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-xs text-slate-500 mb-1">{label}</label>
            <input
              type={type || "text"}
              value={form[key as keyof typeof form]}
              onChange={(e) => set(key, e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        ))}
        <div className="col-span-2">
          <label className="block text-xs text-slate-500 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="col-span-2">
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
            Create Restaurant
          </button>
        </div>
      </form>
    </div>
  );
}

function ReservationList() {
  const [reservations, setReservations] = useState<{ id: string; date: string; startTime: string; partySize: number; status: string; user?: { name: string } }[]>([]);

  useEffect(() => {
    api.get("/reservations/restaurant").then(({ data }) => setReservations(data)).catch(() => {});
  }, []);

  if (!reservations.length) return <p className="text-slate-400 text-sm">No reservations yet.</p>;

  return (
    <div className="space-y-2">
      {reservations.map((r) => (
        <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
          <div>
            <span className="font-medium">{r.date} {r.startTime}</span>
            <span className="ml-2 text-slate-500">{r.user?.name} · {r.partySize}p</span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            r.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
            r.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
            "bg-slate-100 text-slate-500"
          }`}>{r.status}</span>
        </div>
      ))}
    </div>
  );
}
