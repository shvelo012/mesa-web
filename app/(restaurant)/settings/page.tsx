"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Restaurant } from "@/types";
import ChangePasswordForm from "@/components/ui/ChangePasswordForm";
import { useTranslation } from "react-i18next";

type Mode = "reply-to" | "custom-smtp";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, logout, _hasHydrated, can } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  const [mode, setMode] = useState<Mode>("reply-to");
  const [form, setForm] = useState({
    email: "",
    notificationEmail: "",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPass: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [reservationTimes, setReservationTimes] = useState<string[]>([]);
  const [newTime, setNewTime] = useState("");
  const [timesSaving, setTimesSaving] = useState(false);
  const [timesError, setTimesError] = useState("");
  const [timesSuccess, setTimesSuccess] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user || !can("SETTINGS_READ")) {
      router.push("/login");
      return;
    }
    api
      .get("/restaurants/me")
      .then(({ data }: { data: Restaurant }) => {
        setRestaurant(data);
        setForm((f) => ({
          ...f,
          email: data.email || "",
          notificationEmail: data.notificationEmail || "",
          smtpHost: data.smtpHost || "",
          smtpPort: String(data.smtpPort || 587),
          smtpUser: data.smtpUser || "",
        }));
        if (data.smtpConfigured) setMode("custom-smtp");
        if (data.reservationTimes?.length) {
          setReservationTimes([...data.reservationTimes].sort());
        }
      })
      .finally(() => setLoading(false));
  }, [user, _hasHydrated]); // eslint-disable-line

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const body: Record<string, unknown> = {
        email: form.email,
        notificationEmail: form.notificationEmail || null,
      };

      if (mode === "custom-smtp") {
        body.smtpHost = form.smtpHost;
        body.smtpPort = Number(form.smtpPort);
        body.smtpUser = form.smtpUser;
        if (form.smtpPass) body.smtpPass = form.smtpPass;
      } else {
        body.smtpHost = null;
        body.smtpPort = null;
        body.smtpUser = null;
        body.smtpPass = null;
      }

      const { data } = await api.put("/restaurants/me", body);
      setRestaurant((r) => (r ? { ...r, ...data } : r));
      setForm((f) => ({ ...f, smtpPass: "" }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      setError(typeof msg === "string" ? msg : t("settings.failedSave"));
    } finally {
      setSaving(false);
    }
  }

  function addTime() {
    if (!newTime) return;
    if (reservationTimes.includes(newTime)) { setNewTime(""); return; }
    setReservationTimes((prev) => [...prev, newTime].sort());
    setNewTime("");
  }

  function removeTime(t: string) {
    setReservationTimes((prev) => prev.filter((x) => x !== t));
  }

  async function handleSaveTimes() {
    setTimesSaving(true);
    setTimesError("");
    setTimesSuccess(false);
    try {
      const { data } = await api.put("/restaurants/me", { reservationTimes: reservationTimes.length ? reservationTimes : null });
      setRestaurant((r) => (r ? { ...r, ...data } : r));
      setTimesSuccess(true);
      setTimeout(() => setTimesSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setTimesError(typeof msg === "string" ? msg : t("settings.timesError"));
    } finally {
      setTimesSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f5f3ef",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid #f0ede8",
            borderTopColor: "#c4410c",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh" }}>
      <nav className="nav">
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 1.5rem",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}
          >
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <span
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#18160f",
                  letterSpacing: "-0.02em",
                }}
              >
                mesa
              </span>
            </Link>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#c4410c",
                background: "#fef2ec",
                padding: "0.2rem 0.625rem",
                borderRadius: "999px",
              }}
            >
              {t("badge.owner")}
            </span>
          </div>
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <Link href="/dashboard">
              <button className="btn btn-ghost btn-sm">{t("nav.dashboard")}</button>
            </Link>
            <Link href="/manage-reservations">
              <button className="btn btn-ghost btn-sm">{t("nav.reservations")}</button>
            </Link>
            {can("REPORTS") && (
              <Link href="/dashboard/reports">
                <button className="btn btn-ghost btn-sm">{t("nav.reports")}</button>
              </Link>
            )}
            <Link href="/billing">
              <button className="btn btn-ghost btn-sm">Billing</button>
            </Link>
            {user && (
              <span style={{ fontSize: "0.875rem", color: "#9a9088" }}>
                {user.name}
              </span>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              {t("nav.signOut")}
            </button>
          </div>
        </div>
      </nav>

      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "2.5rem 1.5rem",
        }}
      >
        <div className="anim-1" style={{ opacity: 0, marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: 700,
              color: "#18160f",
              letterSpacing: "-0.02em",
            }}
          >
            {t("settings.title")}
          </h1>
          {restaurant && (
            <p
              style={{
                fontSize: "0.9375rem",
                color: "#9a9088",
                marginTop: "0.25rem",
              }}
            >
              {restaurant.name}
            </p>
          )}
        </div>

        <div className="anim-2 card" style={{ opacity: 0, padding: "1.75rem" }}>
          {/* Mode picker */}
          <p
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "#5c5248",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {t("settings.howSend")}
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.625rem",
              marginBottom: "2rem",
            }}
          >
            <label
              style={{
                display: "flex",
                gap: "0.875rem",
                padding: "1rem 1.125rem",
                border: `2px solid ${mode === "reply-to" ? "#c4410c" : "rgba(24,22,15,0.1)"}`,
                borderRadius: "8px",
                cursor: "pointer",
                background: mode === "reply-to" ? "#fef2ec" : "#fafaf8",
                transition: "all 0.15s",
              }}
            >
              <input
                type="radio"
                name="mode"
                checked={mode === "reply-to"}
                onChange={() => setMode("reply-to")}
                style={{
                  marginTop: "3px",
                  accentColor: "#c4410c",
                  flexShrink: 0,
                }}
              />
              <div>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "#18160f",
                  }}
                >
                  {t("settings.mesaServer")}
                </p>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "#5c5248",
                    marginTop: "0.2rem",
                    lineHeight: 1.5,
                  }}
                >
                  {t("settings.mesaServerDesc")}
                </p>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                gap: "0.875rem",
                padding: "1rem 1.125rem",
                border: `2px solid ${mode === "custom-smtp" ? "#c4410c" : "rgba(24,22,15,0.1)"}`,
                borderRadius: "8px",
                cursor: "pointer",
                background: mode === "custom-smtp" ? "#fef2ec" : "#fafaf8",
                transition: "all 0.15s",
              }}
            >
              <input
                type="radio"
                name="mode"
                checked={mode === "custom-smtp"}
                onChange={() => setMode("custom-smtp")}
                style={{
                  marginTop: "3px",
                  accentColor: "#c4410c",
                  flexShrink: 0,
                }}
              />
              <div>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "#18160f",
                  }}
                >
                  {t("settings.ownAccount")}
                  {restaurant?.smtpConfigured && (
                    <span
                      style={{
                        marginLeft: "0.5rem",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: "#16a34a",
                        background: "#f0fdf4",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "999px",
                      }}
                    >
                      {t("settings.active")}
                    </span>
                  )}
                </p>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "#5c5248",
                    marginTop: "0.2rem",
                    lineHeight: 1.5,
                  }}
                >
                  {t("settings.ownAccountDesc")}
                </p>
              </div>
            </label>
          </div>

          {/* Single form */}
          <div
            style={{
              borderTop: "1px solid rgba(24,22,15,0.08)",
              paddingTop: "1.75rem",
            }}
          >
            {error && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  background: "#fef2f2",
                  border: "1px solid rgba(220,38,38,0.2)",
                  borderRadius: "8px",
                  color: "#dc2626",
                  fontSize: "0.875rem",
                  marginBottom: "1.25rem",
                }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  background: "#f0fdf4",
                  border: "1px solid rgba(22,163,74,0.2)",
                  borderRadius: "8px",
                  color: "#16a34a",
                  fontSize: "0.875rem",
                  marginBottom: "1.25rem",
                }}
              >
                {t("settings.saved")}
              </div>
            )}

            <form
              onSubmit={handleSave}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.125rem",
              }}
            >
              <div>
                <label className="label">{t("settings.contactEmail")}</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="input"
                  placeholder={t("settings.contactEmailPlaceholder")}
                />
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#9a9088",
                    marginTop: "0.375rem",
                  }}
                >
                  {mode === "reply-to"
                    ? t("settings.contactEmailNoteReplyTo")
                    : t("settings.contactEmailNoteSmtp")}
                </p>
              </div>

              <div>
                <label className="label">
                  {t("settings.notificationEmail")}
                  <span
                    style={{
                      fontWeight: 400,
                      color: "#9a9088",
                      fontSize: "0.8125rem",
                      marginLeft: "0.375rem",
                    }}
                  >
                    {t("settings.notificationEmailOptional")}
                  </span>
                </label>
                <input
                  type="email"
                  value={form.notificationEmail}
                  onChange={(e) => set("notificationEmail", e.target.value)}
                  className="input"
                  placeholder={t("settings.notificationEmailPlaceholder")}
                />
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#9a9088",
                    marginTop: "0.375rem",
                  }}
                >
                  {t("settings.notificationEmailNote")}
                </p>
              </div>

              {mode === "custom-smtp" && (
                <>
                  <div
                    style={{
                      borderTop: "1px solid rgba(24,22,15,0.08)",
                      paddingTop: "1.125rem",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#5c5248",
                        marginBottom: "1rem",
                      }}
                    >
                      {t("settings.smtpCredentials")}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 110px",
                          gap: "0.75rem",
                        }}
                      >
                        <div>
                          <label className="label">{t("settings.host")}</label>
                          <input
                            required
                            value={form.smtpHost}
                            onChange={(e) => set("smtpHost", e.target.value)}
                            className="input"
                            placeholder={t("settings.hostPlaceholder")}
                          />
                        </div>
                        <div>
                          <label className="label">{t("settings.port")}</label>
                          <input
                            required
                            type="text"
                            inputMode="numeric"
                            value={form.smtpPort}
                            onChange={(e) => set("smtpPort", e.target.value)}
                            className="input"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="label">{t("settings.username")}</label>
                        <input
                          required
                          value={form.smtpUser}
                          onChange={(e) => set("smtpUser", e.target.value)}
                          className="input"
                          placeholder={t("settings.usernamePlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="label">
                          {t("settings.password")}
                          {restaurant?.smtpConfigured && (
                            <span
                              style={{
                                fontWeight: 400,
                                color: "#9a9088",
                                fontSize: "0.8125rem",
                                marginLeft: "0.375rem",
                              }}
                            >
                              {t("settings.passwordKeep")}
                            </span>
                          )}
                        </label>
                        <input
                          type="password"
                          required={!restaurant?.smtpConfigured}
                          value={form.smtpPass}
                          onChange={(e) => set("smtpPass", e.target.value)}
                          className="input"
                          placeholder={
                            restaurant?.smtpConfigured
                              ? "••••••••"
                              : t("settings.passwordPlaceholder")
                          }
                          autoComplete="new-password"
                        />
                        {!restaurant?.smtpConfigured && (
                          <p
                            style={{
                              fontSize: "0.8rem",
                              color: "#9a9088",
                              marginTop: "0.375rem",
                            }}
                          >
                            {t("settings.gmailNote")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary btn-md"
                style={{ marginTop: "0.25rem" }}
              >
                {saving ? t("settings.saving") : t("settings.save")}
              </button>
            </form>
          </div>

          <div className="card" style={{ padding: "1.75rem", marginTop: "1.25rem" }}>
            <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#18160f", marginBottom: "1.25rem" }}>
              {t("settings.changePassword")}
            </h2>
            <ChangePasswordForm />
          </div>
        </div>

        {/* Reservation times */}
        <div className="anim-3 card" style={{ opacity: 0, padding: "1.75rem", marginTop: "1.5rem" }}>
          <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#18160f", marginBottom: "0.375rem" }}>
            {t("settings.reservationTimes")}
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginBottom: "1.25rem", lineHeight: 1.5 }}>
            {t("settings.reservationTimesNote")}
          </p>

          {timesError && (
            <div style={{ padding: "0.75rem 1rem", background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {timesError}
            </div>
          )}
          {timesSuccess && (
            <div style={{ padding: "0.75rem 1rem", background: "#f0fdf4", border: "1px solid rgba(22,163,74,0.2)", borderRadius: "8px", color: "#16a34a", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {t("settings.timesSaved")}
            </div>
          )}

          {reservationTimes.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
              {reservationTimes.map((timeVal) => (
                <span key={timeVal} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", background: "#fef2ec", border: "1px solid rgba(196,65,12,0.2)", borderRadius: "999px", padding: "0.25rem 0.75rem", fontSize: "0.875rem", color: "#c4410c", fontWeight: 600 }}>
                  {timeVal}
                  <button
                    onClick={() => removeTime(timeVal)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#c4410c", fontSize: "1rem", lineHeight: 1, padding: 0, display: "flex", alignItems: "center" }}
                    aria-label={`Remove ${timeVal}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {reservationTimes.length === 0 && (
            <p style={{ fontSize: "0.8125rem", color: "#9a9088", marginBottom: "1rem", fontStyle: "italic" }}>
              {t("settings.noCustomTimes")}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.625rem", marginBottom: "1.25rem" }}>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTime()}
              className="input"
              style={{ width: "140px", colorScheme: "light" }}
            />
            <button
              onClick={addTime}
              disabled={!newTime}
              className="btn btn-outline btn-md"
              style={{ opacity: newTime ? 1 : 0.5 }}
            >
              {t("settings.addTime")}
            </button>
          </div>

          <button
            onClick={handleSaveTimes}
            disabled={timesSaving}
            className="btn btn-primary btn-md"
          >
            {timesSaving ? t("settings.saving") : t("settings.saveTimes")}
          </button>
        </div>
      </div>
    </div>
  );
}
