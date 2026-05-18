"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import ChangePasswordForm from "@/components/ui/ChangePasswordForm";

export default function AccountPage() {
  const { user, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && !user) router.push("/login");
  }, [user, _hasHydrated, router]);

  if (!user) return null;

  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh" }}>
      <nav className="nav">
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <Link href="/restaurants" style={{ textDecoration: "none" }}>
              <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>mesa</span>
            </Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link href="/restaurants">
              <button className="btn btn-ghost btn-sm">Restaurants</button>
            </Link>
            <span style={{ fontSize: "0.875rem", color: "#9a9088" }}>{user.name}</span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { logout(); router.push("/"); }}
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <div className="anim-1" style={{ opacity: 0, marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>
            Account
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "#9a9088", marginTop: "0.25rem" }}>{user.email}</p>
        </div>

        <div className="anim-2 card" style={{ opacity: 0, padding: "1.75rem", marginBottom: "1.25rem" }}>
          <div style={{ marginBottom: "0.25rem" }}>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#5c5248", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.25rem" }}>Email</p>
            <p style={{ fontSize: "0.9375rem", color: "#18160f" }}>{user.email}</p>
            {user.emailVerified ? (
              <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 600 }}>✓ Verified</span>
            ) : (
              <span style={{ fontSize: "0.75rem", color: "#b45309", fontWeight: 600 }}>⚠ Not verified — check your inbox</span>
            )}
          </div>
        </div>

        <div className="anim-3 card" style={{ opacity: 0, padding: "1.75rem" }}>
          <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#18160f", marginBottom: "1.25rem" }}>
            Change password
          </h2>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
