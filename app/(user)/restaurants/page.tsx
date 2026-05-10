"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Restaurant } from "@/types";

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/restaurants").then(({ data }) => setRestaurants(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-slate-900">TablePro</Link>
        <div className="flex gap-3">
          <Link href="/my-reservations" className="text-sm text-slate-600 hover:text-slate-900">My Reservations</Link>
          <Link href="/login" className="text-sm text-blue-600 hover:underline">Sign In</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Find a Table</h1>

        {restaurants.length === 0 && (
          <p className="text-slate-400">No restaurants registered yet.</p>
        )}

        <div className="grid gap-4">
          {restaurants.map((r) => (
            <Link
              key={r.id}
              href={`/restaurants/${r.id}`}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all block"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900 text-lg">{r.name}</h2>
                  {r.cuisine && <p className="text-sm text-blue-600">{r.cuisine}</p>}
                  <p className="text-sm text-slate-500 mt-1">{r.address}</p>
                  {r.description && <p className="text-sm text-slate-400 mt-1">{r.description}</p>}
                </div>
                <div className="text-right text-sm text-slate-400">
                  <p>{r.openTime} – {r.closeTime}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
