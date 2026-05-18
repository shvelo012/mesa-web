"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";

export default function ChangePasswordForm() {
  const { changePassword } = useAuthStore();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {error && (
        <div style={{ padding: "0.75rem 1rem", background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: "0.75rem 1rem", background: "#f0fdf4", border: "1px solid rgba(22,163,74,0.2)", borderRadius: "8px", color: "#16a34a", fontSize: "0.875rem" }}>
          Password changed successfully.
        </div>
      )}
      <div>
        <label className="label">Current password</label>
        <input
          type="password"
          required
          value={form.currentPassword}
          onChange={(e) => set("currentPassword", e.target.value)}
          className="input"
          placeholder="Your current password"
          autoComplete="current-password"
        />
      </div>
      <div>
        <label className="label">New password</label>
        <input
          type="password"
          required
          minLength={8}
          value={form.newPassword}
          onChange={(e) => set("newPassword", e.target.value)}
          className="input"
          placeholder="Min. 8 characters"
          autoComplete="new-password"
        />
      </div>
      <div>
        <label className="label">Confirm new password</label>
        <input
          type="password"
          required
          value={form.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
          className="input"
          placeholder="Repeat new password"
          autoComplete="new-password"
        />
      </div>
      <div>
        <button type="submit" disabled={saving} className="btn btn-primary btn-md">
          {saving ? "Saving…" : "Change password"}
        </button>
      </div>
    </form>
  );
}
