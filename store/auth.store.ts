import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types";
import { api } from "../lib/api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: "USER" | "RESTAURANT_OWNER";
  }) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      login: async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      },

      register: async (formData) => {
        const { data } = await api.post("/auth/register", formData);
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      },

      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    { name: "auth-store", partialize: (s) => ({ user: s.user }) }
  )
);
