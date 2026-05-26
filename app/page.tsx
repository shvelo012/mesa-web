"use client";

import Link from "next/link";

const CUISINE_PILLS = ["Italian", "Japanese", "French", "Steakhouse", "Seafood", "Mexican", "Indian", "Mediterranean"];

export default function Home() {
  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh" }}>
      {/* Nav */}
      <nav className="nav">
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>
            mesa
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href="/login" className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>Sign in</Link>
            <Link href="/register" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "5rem 1.5rem 4rem" }}>
        <div className="anim-1" style={{ opacity: 0, maxWidth: "640px", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#fef2ec",
              color: "#c4410c",
              fontSize: "0.8125rem",
              fontWeight: 600,
              padding: "0.35rem 0.875rem",
              borderRadius: "999px",
              marginBottom: "1.5rem",
              border: "1px solid rgba(196,65,12,0.15)",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c4410c", display: "inline-block" }} />
            Restaurants across the city
          </div>
          <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 3.75rem)", fontWeight: 700, color: "#18160f", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "1.25rem" }}>
            Book the perfect table,<br />every time
          </h1>
          <p style={{ fontSize: "1.125rem", color: "#5c5248", lineHeight: 1.6, fontWeight: 400 }}>
            Discover top restaurants, check availability, and reserve your spot in seconds — no waiting, no phone calls.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="anim-2" style={{ opacity: 0, display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "3rem" }}>
          <Link href="/restaurants" className="btn btn-primary btn-lg" style={{ textDecoration: "none" }}>
            Find a table
          </Link>
          <Link href="/register" className="btn btn-ghost btn-lg" style={{ textDecoration: "none" }}>
            List your restaurant
          </Link>
        </div>

        {/* Cuisine pills */}
        <div className="anim-3" style={{ opacity: 0, marginBottom: "4rem" }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#9a9088", marginBottom: "0.875rem" }}>Browse by cuisine</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {CUISINE_PILLS.map((c) => (
              <Link
                key={c}
                href="/restaurants"
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "999px",
                  background: "#ffffff",
                  border: "1px solid rgba(24,22,15,0.1)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#5c5248",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(196,65,12,0.4)"; (e.currentTarget as HTMLElement).style.color = "#c4410c"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(24,22,15,0.1)"; (e.currentTarget as HTMLElement).style.color = "#5c5248"; }}
              >
                {c}
              </Link>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="anim-4" style={{ opacity: 0 }}>
          <div
            className="card"
            style={{
              padding: "1.75rem 2rem",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1rem",
              textAlign: "center",
            }}
          >
            {[
              { value: "500+", label: "Restaurants" },
              { value: "50k+", label: "Reservations made" },
              { value: "4.9★", label: "Average rating" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>{value}</p>
                <p style={{ fontSize: "0.875rem", color: "#9a9088", marginTop: "0.2rem" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(24,22,15,0.08)", padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "1.25rem", flexWrap: "wrap" }}>
        <p style={{ fontSize: "0.8125rem", color: "#9a9088" }}>© {new Date().getFullYear()} Mesa · Reservations made simple</p>
        <Link href="/privacy-policy" style={{ fontSize: "0.8125rem", color: "#9a9088", textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#c4410c")}
          onMouseLeave={e => (e.currentTarget.style.color = "#9a9088")}
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
