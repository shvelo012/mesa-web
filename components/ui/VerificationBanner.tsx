"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";

export default function VerificationBanner() {
  const { user } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  if (!user || user.emailVerified || dismissed) return null;

  async function handleResend() {
    setResending(true);
    try {
      await api.post("/auth/resend-verification");
      setResent(true);
    } catch {
      // ignore
    } finally {
      setResending(false);
    }
  }

  return (
    <div style={{
      background: "#fffbeb",
      borderBottom: "1px solid rgba(180,83,9,0.2)",
      padding: "0.625rem 1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1rem",
      fontSize: "0.8125rem",
      color: "#92400e",
      flexWrap: "wrap",
    }}>
      <span>
        ⚠️ Please verify your email address — check your inbox for a link from Mesa.
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
        {resent ? (
          <span style={{ color: "#16a34a", fontWeight: 600 }}>Email sent ✓</span>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#b45309", fontWeight: 600, fontFamily: "inherit", fontSize: "0.8125rem", padding: 0, textDecoration: "underline" }}
          >
            {resending ? "Sending…" : "Resend"}
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9088", fontSize: "1rem", lineHeight: 1, padding: "0.125rem", fontFamily: "inherit" }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
