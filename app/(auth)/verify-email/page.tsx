"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useTranslation } from "react-i18next";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { markEmailVerified } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setErrorMsg(t("auth.verifyEmail.noToken"));
      setStatus("error");
      return;
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        markEmailVerified();
        setStatus("success");
        setTimeout(() => {
          router.push("/login");
        }, 2500);
      })
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setErrorMsg(msg || t("auth.verifyEmail.invalidLink"));
        setStatus("error");
      });
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ef", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.25rem 1.5rem" }}>
        <Link href="/" style={{ fontSize: "1.125rem", fontWeight: 700, color: "#18160f", textDecoration: "none", letterSpacing: "-0.02em" }}>
          mesa
        </Link>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div className="anim-1 card" style={{ opacity: 0, width: "100%", maxWidth: "440px", padding: "2.5rem", textAlign: "center" }}>
          {status === "loading" && (
            <>
              <div style={{ width: "40px", height: "40px", border: "3px solid #f0ede8", borderTopColor: "#c4410c", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1.5rem" }} />
              <p style={{ fontSize: "1rem", color: "#5c5248" }}>{t("auth.verifyEmail.verifying")}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div style={{ fontSize: "3rem", marginBottom: "1.25rem" }}>✅</div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>
                {t("auth.verifyEmail.successTitle")}
              </h1>
              <p style={{ fontSize: "0.9375rem", color: "#5c5248" }}>
                {t("auth.verifyEmail.successSub")}
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div style={{ fontSize: "3rem", marginBottom: "1.25rem" }}>❌</div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>
                {t("auth.verifyEmail.failedTitle")}
              </h1>
              <p style={{ fontSize: "0.9375rem", color: "#dc2626", marginBottom: "1.5rem" }}>
                {errorMsg}
              </p>
              <Link href="/verify-email/pending" style={{ fontSize: "0.875rem", color: "#c4410c", fontWeight: 600, textDecoration: "none" }}>
                {t("auth.verifyEmail.requestNew")}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
