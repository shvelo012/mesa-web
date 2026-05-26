"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

const NAV = [
  { href: "/admin", label: "Overview", icon: "◈" },
  { href: "/admin/users", label: "Users", icon: "👤" },
  { href: "/admin/restaurants", label: "Restaurants", icon: "🍽" },
  { href: "/admin/plans", label: "Plans & Features", icon: "📦" },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: "💳" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user || user.role !== "ADMIN") router.push("/login");
  }, [_hasHydrated, user, router]);

  if (!_hasHydrated || !user || user.role !== "ADMIN") return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f0e0b", color: "#e8e4dd" }}>
      {/* Sidebar */}
      <aside style={{
        width: "220px",
        flexShrink: 0,
        background: "#18160f",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 0",
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 10,
      }}>
        <div style={{ padding: "0 1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#c4410c", letterSpacing: "-0.02em" }}>
            mesa <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", fontWeight: 400 }}>admin</span>
          </span>
        </div>
        <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "2px" }}>
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "#fff" : "rgba(255,255,255,0.5)",
                  background: active ? "rgba(196,65,12,0.2)" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: "1rem", opacity: 0.8 }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.07)", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
          {user.name}
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: "220px", flex: 1, padding: "2rem", minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
