"use client";

import { Menu, MenuGroup, MenuItem } from "@/types";
import { DIETARY_TAG_LABELS } from "@/lib/menu-presets";
import { useTranslation } from "react-i18next";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:4000";

function photoUrl(url: string) {
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

function DishCard({ item, layout }: { item: MenuItem; layout?: string }) {
  const isCard = layout === "CARD_GRID";
  return (
    <div style={{
      display: "flex",
      flexDirection: isCard ? "column" : "row",
      justifyContent: "space-between",
      alignItems: isCard ? "flex-start" : "flex-start",
      gap: "0.5rem",
      padding: isCard ? "1rem" : "0.75rem 0",
      borderBottom: isCard ? "none" : "1px solid rgba(24,22,15,0.07)",
      borderRadius: isCard ? "10px" : 0,
      border: isCard ? "1px solid rgba(24,22,15,0.09)" : undefined,
      background: isCard ? "#fff" : "transparent",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
          <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#18160f" }}>{item.name}</span>
          {!isCard && <span style={{ fontWeight: 600, color: "#c4410c", fontSize: "0.9375rem", flexShrink: 0 }}>${Number(item.price).toFixed(2)}</span>}
        </div>
        {item.description && (
          <p style={{ fontSize: "0.8125rem", color: "#5c5248", margin: "0.25rem 0 0", lineHeight: 1.5 }}>{item.description}</p>
        )}
        {item.dietaryTags?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.375rem" }}>
            {item.dietaryTags.map((tag) => (
              <span key={tag} style={{ fontSize: "0.6875rem", fontWeight: 500, padding: "0.125rem 0.5rem", borderRadius: "999px", background: "#f0ede8", color: "#5c5248", border: "1px solid rgba(24,22,15,0.09)" }}>
                {DIETARY_TAG_LABELS[tag] ?? tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {isCard && (
        <span style={{ fontWeight: 700, color: "#c4410c", fontSize: "1rem", marginTop: "0.5rem" }}>${Number(item.price).toFixed(2)}</span>
      )}
    </div>
  );
}

function GroupBlock({ group, layout }: { group: MenuGroup; layout?: string }) {
  const items = group.items ?? [];
  const isGrid = layout === "CARD_GRID";
  const isTwoCol = layout === "TWO_COLUMN";

  return (
    <div style={{ marginBottom: "2rem" }}>
      <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#18160f", margin: "0 0 0.875rem", paddingBottom: "0.5rem", borderBottom: "2px solid #c4410c", display: "inline-block" }}>
        {group.name}
      </h3>
      {items.length === 0 && (
        <p style={{ fontSize: "0.875rem", color: "#9a9088" }}>No items yet</p>
      )}
      {isGrid ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
          {items.map((item) => <DishCard key={item.id} item={item} layout={layout} />)}
        </div>
      ) : isTwoCol ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2rem" }}>
          {items.map((item) => <DishCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div>
          {items.map((item) => <DishCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

interface Props {
  menus: Menu[];
}

export default function MenuDisplay({ menus }: Props) {
  if (!menus.length) return null;

  return (
    <div>
      {menus.map((menu) => (
        <div key={menu.id} style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#18160f", margin: "0 0 1.25rem", letterSpacing: "-0.01em" }}>
            {menu.name}
          </h2>

          {menu.type === "PHOTO" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.875rem" }}>
              {(menu.photos ?? []).sort((a, b) => a.order - b.order).map((photo) => (
                <div key={photo.id} style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(24,22,15,0.09)", aspectRatio: "4/3", background: "#f0ede8" }}>
                  <img src={photoUrl(photo.url)} alt={menu.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
              {(menu.photos ?? []).length === 0 && (
                <p style={{ fontSize: "0.875rem", color: "#9a9088" }}>No photos uploaded</p>
              )}
            </div>
          )}

          {menu.type === "STRUCTURED" && (
            <div>
              {(menu.groups ?? []).sort((a, b) => a.order - b.order).map((group) => (
                <GroupBlock key={group.id} group={group} layout={menu.layoutStyle ?? "LIST"} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
