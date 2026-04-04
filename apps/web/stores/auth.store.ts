"use client";

/**
 * Auth Zustand store
 * Kullanıcı oturum durumunu ve token yönetimini sağlar
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@notcast/shared";
import apiClient from "@/lib/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.post<{
            success: boolean;
            data: { user: User; accessToken: string; refreshToken: string; expiresIn: number };
          }>("/auth/login", { email, password });

          localStorage.setItem("notcast-auth-token", data.data.accessToken);
          localStorage.setItem("notcast-refresh-token", data.data.refreshToken);
          // Middleware'in oturum durumunu görebilmesi için frontend cookie set et
          document.cookie = `notcast-session=1; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
          set({ user: data.data.user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (email, password, name) => {
        set({ isLoading: true });
        try {
          await apiClient.post("/auth/register", { email, password, name });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          const refreshToken = localStorage.getItem("notcast-refresh-token");
          await apiClient.post("/auth/logout", { refreshToken });
        } catch {
          // Hata olsa bile local state temizle
        } finally {
          localStorage.removeItem("notcast-auth-token");
          localStorage.removeItem("notcast-refresh-token");
          // Session cookie'yi temizle
          document.cookie = "notcast-session=; path=/; max-age=0";
          set({ user: null, isAuthenticated: false });
        }
      },

      refreshUser: async () => {
        try {
          const { data } = await apiClient.get<{
            success: boolean;
            data: { user: User };
          }>("/auth/me");
          set({ user: data.data.user, isAuthenticated: true });
        } catch {
          get().clearAuth();
        }
      },

      setUser: (user) => set({ user, isAuthenticated: true }),

      clearAuth: () => {
        localStorage.removeItem("notcast-auth-token");
        localStorage.removeItem("notcast-refresh-token");
        document.cookie = "notcast-session=; path=/; max-age=0";
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "notcast-auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
      ),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
