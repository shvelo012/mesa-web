"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function RegisterPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as "USER" | "RESTAURANT_OWNER",
  });
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const router = useRouter();

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      router.push(`/verify-email/pending?email=${encodeURIComponent(form.email)}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || t("auth.register.registrationFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ef", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontSize: "1.125rem", fontWeight: 700, color: "#18160f", textDecoration: "none", letterSpacing: "-0.02em" }}>
          mesa
        </Link>
        <LanguageSwitcher />
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div className="anim-1 card" style={{ opacity: 0, width: "100%", maxWidth: "440px", padding: "2.5rem" }}>

          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "1.625rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em", marginBottom: "0.375rem" }}>
              {t("auth.register.title")}
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "#9a9088" }}>
              {t("auth.register.subtitle")}
            </p>
          </div>

          {error && (
            <div style={{ padding: "0.75rem 1rem", background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
              {error}
            </div>
          )}

          {/* Role toggle */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label" style={{ marginBottom: "0.625rem" }}>{t("auth.register.iWantTo")}</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {([
                { value: "USER", label: t("auth.register.findAndBook"), icon: "🍽️" },
                { value: "RESTAURANT_OWNER", label: t("auth.register.listMyRestaurant"), icon: "🏪" },
              ] as const).map(({ value, label, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("role", value)}
                  style={{
                    padding: "0.875rem 0.75rem",
                    borderRadius: "8px",
                    border: "1.5px solid",
                    borderColor: form.role === value ? "#c4410c" : "rgba(24,22,15,0.12)",
                    background: form.role === value ? "#fef2ec" : "#ffffff",
                    color: form.role === value ? "#c4410c" : "#5c5248",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    textAlign: "left" as const,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: "1.25rem", marginBottom: "0.375rem" }}>{icon}</div>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
            <div>
              <label className="label">{t("auth.register.fullName")}</label>
              <input required value={form.name} onChange={(e) => set("name", e.target.value)} className="input" placeholder={t("auth.register.namePlaceholder")} />
            </div>
            <div>
              <label className="label">{t("auth.register.emailLabel")}</label>
              <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} className="input" placeholder={t("auth.register.emailPlaceholder")} />
            </div>
            <div>
              <label className="label">{t("auth.register.passwordLabel")}</label>
              <input type="password" required minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} className="input" placeholder={t("auth.register.passwordPlaceholder")} />
            </div>
            {/* Privacy policy consent */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                required
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                style={{ marginTop: "2px", accentColor: "#c4410c", width: "15px", height: "15px", flexShrink: 0, cursor: "pointer" }}
              />
              <span style={{ fontSize: "0.8125rem", color: "#5c5248", lineHeight: 1.5 }}>
                {t("auth.register.privacyConsent")}{" "}
                <Link href="/privacy-policy" target="_blank" style={{ color: "#c4410c", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "2px" }}>
                  {t("auth.register.privacyPolicy")}
                </Link>
              </span>
            </label>

            <button type="submit" className="btn btn-primary btn-md" disabled={loading || !agreedToPrivacy} style={{ width: "100%", marginTop: "0.375rem" }}>
              {loading ? t("auth.register.creatingAccount") : t("auth.register.createAccount")}
            </button>
          </form>

          <div style={{ marginTop: "1.75rem", paddingTop: "1.75rem", borderTop: "1px solid rgba(24,22,15,0.08)", textAlign: "center" }}>
            <p style={{ fontSize: "0.9375rem", color: "#5c5248" }}>
              {t("auth.register.hasAccount")}{" "}
              <Link href="/login" style={{ color: "#c4410c", fontWeight: 600, textDecoration: "none" }}>{t("auth.register.signIn")}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
