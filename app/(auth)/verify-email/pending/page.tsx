"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useTranslation } from "react-i18next";

export default function VerifyEmailPendingPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  async function handleResend() {
    setResending(true);
    setError("");
    try {
      await api.post("/auth/resend-verification", { email });
      setResent(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || t("auth.verifyPending.failedResend"));
    } finally {
      setResending(false);
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
        <div className="anim-1 card" style={{ opacity: 0, width: "100%", maxWidth: "440px", padding: "2.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1.25rem" }}>📬</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>
            {t("auth.verifyPending.title")}
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "#5c5248", lineHeight: 1.6, marginBottom: "0.5rem" }}>
            {t("auth.verifyPending.sentLink")}
          </p>
          {email && (
            <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#18160f", marginBottom: "1.5rem" }}>
              {email}
            </p>
          )}
          <p style={{ fontSize: "0.875rem", color: "#9a9088", marginBottom: "2rem", lineHeight: 1.6 }}>
            {t("auth.verifyPending.clickLink")}
          </p>

          {resent ? (
            <div style={{ padding: "0.75rem 1rem", background: "#f0fdf4", border: "1px solid rgba(22,163,74,0.2)", borderRadius: "8px", color: "#16a34a", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
              {t("auth.verifyPending.emailResent")}
            </div>
          ) : (
            <>
              {error && (
                <div style={{ padding: "0.75rem 1rem", background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                  {error}
                </div>
              )}
              <button
                onClick={handleResend}
                disabled={resending || !email}
                className="btn btn-outline btn-md"
                style={{ width: "100%", marginBottom: "1rem" }}
              >
                {resending ? t("auth.verifyPending.resending") : t("auth.verifyPending.resend")}
              </button>
            </>
          )}

          <Link href="/login" style={{ fontSize: "0.875rem", color: "#9a9088", textDecoration: "none" }}>
            {t("auth.verifyPending.backToSignIn")}
          </Link>
        </div>
      </div>
    </div>
  );
}
