"use client";

import { useState } from "react";
import { Menu, MenuGroup, MenuItem, DietaryTag } from "@/types";
import { api } from "@/lib/api";
import { DIETARY_TAG_LABELS } from "@/lib/menu-presets";
import MenuItemForm from "./MenuItemForm";

interface Props {
  menu: Menu;
  onUpdate: (menu: Menu) => void;
}

function ItemRow({ item, groupId, menuId, onDelete, onUpdate }: {
  item: MenuItem;
  groupId: string;
  menuId: string;
  onDelete: () => void;
  onUpdate: (item: MenuItem) => void;
}) {
  const [editing, setEditing] = useState(false);

  async function handleUpdate(data: { name: string; price: number; description: string; dietaryTags: DietaryTag[] }) {
    const { data: updated } = await api.put(`/menus/${menuId}/groups/${groupId}/items/${item.id}`, data);
    onUpdate(updated);
    setEditing(false);
  }

  if (editing) {
    return (
      <div style={{ padding: "0.875rem", background: "#fafaf8", borderRadius: "8px", border: "1px solid rgba(24,22,15,0.09)" }}>
        <MenuItemForm initial={item} onSave={handleUpdate} onCancel={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.75rem 0", borderBottom: "1px solid rgba(24,22,15,0.06)" }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
          <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#18160f" }}>{item.name}</span>
          <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#c4410c" }}>${Number(item.price).toFixed(2)}</span>
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
      <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
        <button onClick={() => setEditing(true)} style={{ background: "none", border: "1px solid rgba(24,22,15,0.16)", borderRadius: "6px", padding: "0.25rem 0.5rem", cursor: "pointer", fontSize: "0.75rem", color: "#5c5248", fontFamily: "inherit" }}>Edit</button>
        <button onClick={onDelete} style={{ background: "none", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "6px", padding: "0.25rem 0.5rem", cursor: "pointer", fontSize: "0.75rem", color: "#dc2626", fontFamily: "inherit" }}>×</button>
      </div>
    </div>
  );
}

function GroupSection({ group, menuId, onUpdate, onDelete }: {
  group: MenuGroup;
  menuId: string;
  onUpdate: (group: MenuGroup) => void;
  onDelete: () => void;
}) {
  const [addingItem, setAddingItem] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [groupName, setGroupName] = useState(group.name);
  const items = group.items ?? [];

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim()) return;
    const { data } = await api.put(`/menus/${menuId}/groups/${group.id}`, { name: groupName.trim() });
    onUpdate({ ...group, name: data.name });
    setEditingName(false);
  }

  async function handleAddItem(data: { name: string; price: number; description: string; dietaryTags: DietaryTag[] }) {
    const { data: item } = await api.post(`/menus/${menuId}/groups/${group.id}/items`, data);
    onUpdate({ ...group, items: [...items, item] });
    setAddingItem(false);
  }

  async function handleDeleteItem(itemId: string) {
    await api.delete(`/menus/${menuId}/groups/${group.id}/items/${itemId}`);
    onUpdate({ ...group, items: items.filter((i) => i.id !== itemId) });
  }

  function handleUpdateItem(updated: MenuItem) {
    onUpdate({ ...group, items: items.map((i) => (i.id === updated.id ? updated : i)) });
  }

  return (
    <div style={{ border: "1px solid rgba(24,22,15,0.09)", borderRadius: "10px", overflow: "hidden", background: "#fff" }}>
      {/* Group header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", background: "#f5f3ef", borderBottom: "1px solid rgba(24,22,15,0.09)" }}>
        {editingName ? (
          <form onSubmit={handleRename} style={{ display: "flex", gap: "0.5rem", flex: 1 }}>
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} className="input" style={{ padding: "0.25rem 0.5rem", fontSize: "0.9375rem" }} autoFocus />
            <button type="submit" className="btn btn-primary btn-sm">Save</button>
            <button type="button" onClick={() => { setEditingName(false); setGroupName(group.name); }} className="btn btn-ghost btn-sm">Cancel</button>
          </form>
        ) : (
          <>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "#18160f" }}>{group.name}</span>
            <div style={{ display: "flex", gap: "0.375rem" }}>
              <button onClick={() => setEditingName(true)} style={{ background: "none", border: "1px solid rgba(24,22,15,0.16)", borderRadius: "6px", padding: "0.25rem 0.625rem", cursor: "pointer", fontSize: "0.75rem", color: "#5c5248", fontFamily: "inherit" }}>Rename</button>
              <button onClick={onDelete} style={{ background: "none", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "6px", padding: "0.25rem 0.625rem", cursor: "pointer", fontSize: "0.75rem", color: "#dc2626", fontFamily: "inherit" }}>Delete group</button>
            </div>
          </>
        )}
      </div>

      {/* Items */}
      <div style={{ padding: "0 1rem" }}>
        {items.length === 0 && !addingItem && (
          <p style={{ fontSize: "0.8125rem", color: "#9a9088", padding: "1rem 0", textAlign: "center" }}>No dishes yet</p>
        )}
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            groupId={group.id}
            menuId={menuId}
            onDelete={() => handleDeleteItem(item.id)}
            onUpdate={handleUpdateItem}
          />
        ))}
        {addingItem && (
          <div style={{ padding: "0.875rem 0" }}>
            <MenuItemForm onSave={handleAddItem} onCancel={() => setAddingItem(false)} />
          </div>
        )}
      </div>

      {/* Add dish button */}
      {!addingItem && (
        <div style={{ padding: "0.75rem 1rem", borderTop: items.length > 0 ? "1px solid rgba(24,22,15,0.06)" : "none" }}>
          <button onClick={() => setAddingItem(true)} className="btn btn-outline btn-sm">+ Add dish</button>
        </div>
      )}
    </div>
  );
}

export default function StructuredMenuEditor({ menu, onUpdate }: Props) {
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const groups = menu.groups ?? [];

  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const { data } = await api.post(`/menus/${menu.id}/groups`, { name: newGroupName.trim() });
    onUpdate({ ...menu, groups: [...groups, { ...data, items: [] }] });
    setNewGroupName("");
    setAddingGroup(false);
  }

  async function handleDeleteGroup(groupId: string) {
    await api.delete(`/menus/${menu.id}/groups/${groupId}`);
    onUpdate({ ...menu, groups: groups.filter((g) => g.id !== groupId) });
  }

  function handleUpdateGroup(updated: MenuGroup) {
    onUpdate({ ...menu, groups: groups.map((g) => (g.id === updated.id ? updated : g)) });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      {groups.map((group) => (
        <GroupSection
          key={group.id}
          group={group}
          menuId={menu.id}
          onUpdate={handleUpdateGroup}
          onDelete={() => handleDeleteGroup(group.id)}
        />
      ))}

      {addingGroup ? (
        <form onSubmit={handleAddGroup} style={{ display: "flex", gap: "0.5rem" }}>
          <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="input" placeholder="Section name, e.g. Starters" autoFocus />
          <button type="submit" className="btn btn-primary btn-sm">Add</button>
          <button type="button" onClick={() => { setAddingGroup(false); setNewGroupName(""); }} className="btn btn-ghost btn-sm">Cancel</button>
        </form>
      ) : (
        <button onClick={() => setAddingGroup(true)} className="btn btn-outline btn-sm" style={{ alignSelf: "flex-start" }}>
          + Add section
        </button>
      )}
    </div>
  );
}
