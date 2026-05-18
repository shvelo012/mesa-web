import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, Permission } from "../types";
import { api } from "../lib/api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  permissions: Permission[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: "USER" | "RESTAURANT_OWNER";
  }) => Promise<void>;
  logout: () => void;
  can: (permission: Permission) => boolean;
  loadPermissions: () => Promise<void>;
  markEmailVerified: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      permissions: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      login: async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
        await get().loadPermissions();
      },

      register: async (formData) => {
        await api.post("/auth/register", formData);
        // No tokens — user must verify email before logging in
      },

      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({ user: null, accessToken: null, refreshToken: null, permissions: [] });
      },

      can: (permission: Permission) => {
        const { user, permissions } = get();
        if (!user) return false;
        if (user.role === "RESTAURANT_OWNER") return true;
        return permissions.includes(permission);
      },

      loadPermissions: async () => {
        try {
          const { data } = await api.get("/restaurants/me/all");
          if (Array.isArray(data) && data.length > 0) {
            const first = data[0];
            set({ permissions: first.permissions || [] });
          }
        } catch {
          // silently fail — permissions stay empty
        }
      },

      markEmailVerified: () => {
        set((s) => s.user ? { user: { ...s.user, emailVerified: true } } : {});
      },

      changePassword: async (currentPassword, newPassword) => {
        await api.put("/auth/password", { currentPassword, newPassword });
      },
    }),
    {
      name: "auth-store",
      partialize: (s) => ({ user: s.user, permissions: s.permissions }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
