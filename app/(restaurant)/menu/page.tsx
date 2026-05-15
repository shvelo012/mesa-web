"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Menu } from "@/types";
import CreateMenuModal from "@/components/menu/CreateMenuModal";
import PhotoMenuEditor from "@/components/menu/PhotoMenuEditor";
import StructuredMenuEditor from "@/components/menu/StructuredMenuEditor";

const LAYOUT_LABELS: Record<string, string> = {
  LIST: "List",
  CARD_GRID: "Card Grid",
  TWO_COLUMN: "Two Column",
};

export default function MenuPage() {
  const { user, logout, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user || user.role !== "RESTAURANT_OWNER") { router.push("/login"); return; }
    api.get("/menus/restaurant")
      .then(({ data }) => setMenus(data))
      .finally(() => setLoading(false));
  }, [user, _hasHydrated]);

  function handleCreated(menu: Menu) {
    setMenus((prev) => [...prev, menu]);
    setExpandedId(menu.id);
  }

  function handleUpdate(updated: Menu) {
    setMenus((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  async function handleDelete(menuId: string, menuName: string) {
    if (!window.confirm(`Delete "${menuName}"? This cannot be undone.`)) return;
    setDeletingId(menuId);
    try {
      await api.delete(`/menus/${menuId}`);
      setMenus((prev) => prev.filter((m) => m.id !== menuId));
      if (expandedId === menuId) setExpandedId(null);
    } catch {
      alert("Failed to delete menu.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f3ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid #f0ede8", borderTopColor: "#c4410c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh" }}>
      {showCreate && (
        <CreateMenuModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}

      {/* Nav */}
      <nav className="nav">
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link href="/dashboard" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em", textDecoration: "none" }}>mesa</Link>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#c4410c", background: "#fef2ec", padding: "0.2rem 0.625rem", borderRadius: "999px" }}>Owner</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link href="/dashboard" style={{ fontSize: "0.875rem", color: "#5c5248", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/manage-reservations" style={{ fontSize: "0.875rem", color: "#5c5248", textDecoration: "none" }}>Reservations</Link>
            <button onClick={logout} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", color: "#9a9088", fontFamily: "inherit" }}>Sign out</button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#18160f", letterSpacing: "-0.02em", margin: 0 }}>Menus</h1>
            <p style={{ fontSize: "0.9375rem", color: "#5c5248", margin: "0.375rem 0 0" }}>Create and manage your restaurant menus</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-md">+ Create menu</button>
        </div>

        {/* Empty state */}
        {menus.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 2rem", border: "2px dashed rgba(24,22,15,0.14)", borderRadius: "14px", background: "#fafaf8" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🍽️</div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#18160f", margin: "0 0 0.5rem" }}>No menus yet</h2>
            <p style={{ fontSize: "0.9375rem", color: "#5c5248", margin: "0 0 1.5rem" }}>Create your first menu — photo or structured.</p>
            <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-md">Create menu</button>
          </div>
        )}

        {/* Menu list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {menus.map((menu) => {
            const expanded = expandedId === menu.id;
            return (
              <div key={menu.id} style={{ background: "#fff", borderRadius: "12px", border: "1px solid rgba(24,22,15,0.09)", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                {/* Menu card header */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem" }}>
                  <div
                    style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#fef2ec", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", flexShrink: 0 }}
                  >
                    {menu.type === "PHOTO" ? "📷" : "📋"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#18160f" }}>{menu.name}</div>
                    <div style={{ fontSize: "0.8125rem", color: "#9a9088", marginTop: "0.125rem" }}>
                      {menu.type === "PHOTO"
                        ? `${(menu.photos ?? []).length} photo${(menu.photos ?? []).length !== 1 ? "s" : ""}`
                        : `${(menu.groups ?? []).length} section${(menu.groups ?? []).length !== 1 ? "s" : ""} · ${LAYOUT_LABELS[menu.layoutStyle ?? "LIST"] ?? menu.layoutStyle}`
                      }
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => setExpandedId(expanded ? null : menu.id)}
                      className="btn btn-outline btn-sm"
                    >
                      {expanded ? "Collapse" : "Edit content"}
                    </button>
                    <button
                      onClick={() => handleDelete(menu.id, menu.name)}
                      disabled={deletingId === menu.id}
                      style={{ background: "none", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "6px", padding: "0.25rem 0.625rem", cursor: "pointer", fontSize: "0.8125rem", color: "#dc2626", fontFamily: "inherit" }}
                    >
                      {deletingId === menu.id ? "…" : "Delete"}
                    </button>
                  </div>
                </div>

                {/* Expanded editor */}
                {expanded && (
                  <div style={{ borderTop: "1px solid rgba(24,22,15,0.09)", padding: "1.25rem" }}>
                    {menu.type === "PHOTO" ? (
                      <PhotoMenuEditor menu={menu} onUpdate={handleUpdate} />
                    ) : (
                      <StructuredMenuEditor menu={menu} onUpdate={handleUpdate} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
