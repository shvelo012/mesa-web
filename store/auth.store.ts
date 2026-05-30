import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, Permission } from "../types";
import { api, setAccessToken, refreshSilently } from "../lib/api";

interface AuthState {
  user: User | null;
  permissions: Permission[];
  featureKeys: string[];
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
  silentRefresh: () => Promise<void>;
  can: (permission: Permission) => boolean;
  hasFeature: (key: string) => boolean;
  loadPermissions: () => Promise<void>;
  loadFeatures: () => Promise<void>;
  markEmailVerified: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      permissions: [],
      featureKeys: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      login: async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        // refreshToken is set as HttpOnly cookie by the server
        setAccessToken(data.accessToken);
        set({ user: data.user });
        await get().loadPermissions();
        await get().loadFeatures();
      },

      register: async (formData) => {
        await api.post("/auth/register", formData);
      },

      logout: () => {
        setAccessToken(null);
        // Tell server to clear the HttpOnly refresh cookie
        api.post("/auth/logout").catch(() => {});
        set({ user: null, permissions: [], featureKeys: [] });
      },

      silentRefresh: async () => {
        try {
          await refreshSilently();
        } catch {
          setAccessToken(null);
          set({ user: null, permissions: [], featureKeys: [] });
        }
      },

      can: (permission: Permission) => {
        const { user, permissions } = get();
        if (!user) return false;
        if (user.role === "ADMIN" || user.role === "RESTAURANT_OWNER") return true;
        return permissions.includes(permission);
      },

      hasFeature: (key: string) => {
        const { user, featureKeys } = get();
        if (!user) return false;
        if (user.role === "ADMIN") return true;
        return featureKeys.includes(key);
      },

      loadPermissions: async () => {
        try {
          const { data } = await api.get("/restaurants/me/all");
          if (Array.isArray(data) && data.length > 0) {
            const first = data[0];
            set({ permissions: first.permissions || [] });
          }
        } catch {
          // silently fail
        }
      },

      loadFeatures: async () => {
        try {
          const { user } = get();
          if (!user || (user.role !== "RESTAURANT_OWNER" && user.role !== "ADMIN")) return;
          const { data } = await api.get("/plans/my-features");
          if (Array.isArray(data)) {
            set({ featureKeys: data });
          }
        } catch {
          // silently fail — featureKeys stays empty
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
      // Never persist tokens — access token in memory, refresh token in HttpOnly cookie
      partialize: (s) => ({ user: s.user, permissions: s.permissions, featureKeys: s.featureKeys }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // If user was logged in, try to get a fresh access token from the HttpOnly cookie
        if (state?.user) {
          state.silentRefresh();
        }
      },
    }
  )
);
