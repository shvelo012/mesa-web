"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Restaurant } from "@/types";
import { useAuthStore } from "@/store/auth.store";
import StarRating from "@/components/reviews/StarRating";

const CUISINE_COLORS: Record<string, string> = {
  Italian: "#dc2626", Japanese: "#7c3aed", French: "#1d4ed8",
  Steakhouse: "#92400e", Seafood: "#0369a1", Mexican: "#b45309",
  Indian: "#d97706", Mediterranean: "#065f46",
};

function getCuisineColor(cuisine?: string) {
  if (!cuisine) return "#9a9088";
  return CUISINE_COLORS[cuisine] || "#c4410c";
}

function RestaurantCard({ r }: { r: Restaurant }) {
  const color = getCuisineColor(r.cuisine);
  return (
    <Link href={`/restaurants/${r.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div className="card-hover" style={{ overflow: "hidden" }}>
        {/* Color band */}
        <div style={{ height: "6px", background: color, opacity: 0.85 }} />
        <div style={{ padding: "1.25rem 1.25rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.625rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.01em", lineHeight: 1.3 }}>
              {r.name}
            </h2>
            {r.cuisine && (
              <span style={{ fontSize: "0.6875rem", fontWeight: 600, color, background: `${color}12`, border: `1px solid ${color}22`, padding: "0.15rem 0.5rem", borderRadius: "999px", whiteSpace: "nowrap", flexShrink: 0 }}>
                {r.cuisine}
              </span>
            )}
          </div>
          <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {r.address}
          </p>
          {r.description && (
            <p style={{ fontSize: "0.8125rem", color: "#5c5248", marginBottom: "1rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
              {r.description}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.8125rem", color: "#9a9088", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
              {r.openTime} – {r.closeTime}
            </span>
            {r.avgStars != null ? (
              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <StarRating value={Math.round(r.avgStars)} readonly size={13} />
                <span style={{ fontSize: "0.75rem", color: "#9a9088" }}>
                  {Number(r.avgStars).toFixed(1)} ({r.reviewCount})
                </span>
              </span>
            ) : (
              <span style={{ fontSize: "0.75rem", color: "#c8c4be" }}>No reviews</span>
            )}
          </div>
          <div style={{ marginTop: "0.75rem", textAlign: "right" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#c4410c" }}>Reserve →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { user, logout } = useAuthStore();

  useEffect(() => {
    api.get("/restaurants").then(({ data }) => setRestaurants(data)).finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? restaurants.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.cuisine?.toLowerCase().includes(search.toLowerCase()) ||
        r.address.toLowerCase().includes(search.toLowerCase())
      )
    : restaurants;

  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh" }}>
      {/* Nav */}
      <nav className="nav">
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#18160f", textDecoration: "none", letterSpacing: "-0.02em" }}>
            mesa
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {user ? (
              <>
                <Link href="/reservations" style={{ fontSize: "0.875rem", fontWeight: 500, color: "#5c5248", textDecoration: "none" }}>
                  My Reservations
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>Sign in</Link>
                <Link href="/register" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>Sign up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* Header + search */}
        <div className="anim-1" style={{ opacity: 0, marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em", marginBottom: "1.25rem" }}>
            Find your table
          </h1>
          <div style={{ position: "relative", maxWidth: "480px" }}>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9088" strokeWidth="2"
              style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)" }}
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="input"
              placeholder="Search by name, cuisine, or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <p style={{ fontSize: "0.875rem", color: "#9a9088", marginBottom: "1.5rem" }}>
            {filtered.length === 0 ? "No restaurants found" : `${filtered.length} restaurant${filtered.length !== 1 ? "s" : ""}`}
            {search && ` for "${search}"`}
          </p>
        )}

        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card" style={{ height: "180px", background: "linear-gradient(90deg, #f0ede8, #e8e4de, #f0ede8)", backgroundSize: "200% 100%", animation: "fadeIn 1.5s infinite" }} />
            ))}
          </div>
        )}

        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {filtered.map((r, i) => (
              <div key={r.id} className={`anim-${Math.min(i + 1, 5)}`} style={{ opacity: 0 }}>
                <RestaurantCard r={r} />
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && restaurants.length === 0 && (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🍽️</div>
            <p style={{ fontSize: "1.125rem", fontWeight: 600, color: "#18160f", marginBottom: "0.5rem" }}>No restaurants yet</p>
            <p style={{ fontSize: "0.9375rem", color: "#9a9088" }}>Be the first to list your restaurant.</p>
          </div>
        )}
      </div>
    </div>
  );
}
