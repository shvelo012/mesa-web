"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as "USER" | "RESTAURANT_OWNER",
  });
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
      router.push(form.role === "RESTAURANT_OWNER" ? "/dashboard" : "/restaurants");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Create Account</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
            <div className="flex gap-3">
              {(["USER", "RESTAURANT_OWNER"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set("role", r)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    form.role === r
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {r === "USER" ? "Customer" : "Restaurant Owner"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-500 text-center">
          Have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
