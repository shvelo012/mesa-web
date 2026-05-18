"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setUnverified(false);
    setLoading(true);
    try {
      await login(email, password);
      const role = useAuthStore.getState().user?.role;
      router.push(role === "RESTAURANT_OWNER" ? "/dashboard" : "/restaurants");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (msg === "EMAIL_NOT_VERIFIED") {
        setUnverified(true);
      } else {
        setError(msg || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ef", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.25rem 1.5rem" }}>
        <Link href="/" style={{ fontSize: "1.125rem", fontWeight: 700, color: "#18160f", textDecoration: "none", letterSpacing: "-0.02em" }}>
          mesa
        </Link>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div className="anim-1 card" style={{ opacity: 0, width: "100%", maxWidth: "420px", padding: "2.5rem" }}>

          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "1.625rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em", marginBottom: "0.375rem" }}>
              Welcome back
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "#9a9088" }}>
              Sign in to your Mesa account
            </p>
          </div>

          {error && (
            <div style={{ padding: "0.75rem 1rem", background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
              {error}
            </div>
          )}

          {unverified && (
            <div style={{ padding: "0.875rem 1rem", background: "#fffbeb", border: "1px solid rgba(180,83,9,0.25)", borderRadius: "8px", marginBottom: "1.25rem" }}>
              <p style={{ fontSize: "0.875rem", color: "#92400e", fontWeight: 600, marginBottom: "0.375rem" }}>
                Email not verified
              </p>
              <p style={{ fontSize: "0.8125rem", color: "#92400e", marginBottom: "0.75rem" }}>
                Check your inbox for the verification link, or get a new one.
              </p>
              <Link
                href={`/verify-email/pending?email=${encodeURIComponent(email)}`}
                style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#b45309", textDecoration: "underline" }}
              >
                Resend verification email →
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
            <div>
              <label className="label">Email address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
            </div>
            <button type="submit" className="btn btn-primary btn-md" disabled={loading} style={{ width: "100%", marginTop: "0.375rem" }}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div style={{ marginTop: "1.75rem", paddingTop: "1.75rem", borderTop: "1px solid rgba(24,22,15,0.08)", textAlign: "center" }}>
            <p style={{ fontSize: "0.9375rem", color: "#5c5248" }}>
              Don&apos;t have an account?{" "}
              <Link href="/register" style={{ color: "#c4410c", fontWeight: 600, textDecoration: "none" }}>
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
