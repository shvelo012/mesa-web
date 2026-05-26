"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import ChangePasswordForm from "@/components/ui/ChangePasswordForm";
import StarRating from "@/components/reviews/StarRating";
import { api } from "@/lib/api";
import { Review } from "@/types";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function AccountPage() {
  const { t } = useTranslation();
  const { user, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (_hasHydrated && !user) router.push("/login");
  }, [user, _hasHydrated, router]);

  useEffect(() => {
    if (!user) return;
    api.get("/reviews/me").then(({ data }) => setMyReviews(data)).catch(() => {});
  }, [user]);

  async function deleteReview(id: string) {
    setDeletingId(id);
    try {
      await api.delete(`/reviews/${id}`);
      setMyReviews((r) => r.filter((x) => x.id !== id));
    } catch {
      // silently ignore
    } finally {
      setDeletingId(null);
    }
  }

  if (!user) return null;

  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh" }}>
      <nav className="nav">
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/restaurants" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>mesa</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <LanguageSwitcher />
            <Link href="/restaurants">
              <button className="btn btn-ghost btn-sm">{t("nav.restaurants")}</button>
            </Link>
            <span style={{ fontSize: "0.875rem", color: "#9a9088" }}>{user.name}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => { logout(); router.push("/"); }}>
              {t("nav.signOut")}
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <div className="anim-1" style={{ opacity: 0, marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>
            {t("account.title")}
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "#9a9088", marginTop: "0.25rem" }}>{user.email}</p>
        </div>

        <div className="anim-2 card" style={{ opacity: 0, padding: "1.75rem", marginBottom: "1.25rem" }}>
          <div style={{ marginBottom: "0.25rem" }}>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#5c5248", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.25rem" }}>{t("account.email")}</p>
            <p style={{ fontSize: "0.9375rem", color: "#18160f" }}>{user.email}</p>
            {user.emailVerified ? (
              <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 600 }}>{t("account.verified")}</span>
            ) : (
              <span style={{ fontSize: "0.75rem", color: "#b45309", fontWeight: 600 }}>{t("account.notVerified")}</span>
            )}
          </div>
        </div>

        <div className="anim-3 card" style={{ opacity: 0, padding: "1.75rem", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#18160f", marginBottom: "1.25rem" }}>
            {t("account.changePassword")}
          </h2>
          <ChangePasswordForm />
        </div>

        <div className="anim-4 card" style={{ opacity: 0, padding: "1.75rem" }}>
          <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#18160f", marginBottom: "1.25rem" }}>
            {t("account.myReviews")}
          </h2>
          {myReviews.length === 0 ? (
            <p style={{ fontSize: "0.9375rem", color: "#9a9088" }}>{t("account.noReviews")}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {myReviews.map((r) => (
                <div key={r.id} style={{ borderBottom: "1px solid rgba(24,22,15,0.07)", paddingBottom: "0.875rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <Link href={`/restaurants/${r.restaurant?.id ?? r.restaurantId}`} style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#18160f", textDecoration: "none" }}>
                      {r.restaurant?.name ?? "Restaurant"}
                    </Link>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <StarRating value={r.stars} readonly size={13} />
                      <span style={{ fontSize: "0.75rem", color: "#9a9088" }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {r.edited && <span style={{ fontSize: "0.7rem", color: "#9a9088" }}>{t("account.edited")}</span>}
                  {r.text && <p style={{ fontSize: "0.875rem", color: "#3c3530", marginTop: "0.25rem", lineHeight: 1.5 }}>{r.text}</p>}
                  <button
                    onClick={() => deleteReview(r.id)}
                    disabled={deletingId === r.id}
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#dc2626" }}
                  >
                    {deletingId === r.id ? t("account.deleting") : t("account.delete")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
