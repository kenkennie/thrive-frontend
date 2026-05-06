import { create } from "zustand";
import { persist } from "zustand/middleware";
import { tokenStorage } from "@/lib/api/client";
import authApi, { type AuthResponse } from "@/lib/api/auth";

// ─────────────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  isSuperAdmin: boolean;
  roles: string[];
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isLoggingOut: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.login({ email, password });
          const payload = data.data ?? (data as unknown as AuthResponse);

          tokenStorage.setTokens(payload.accessToken, payload.refreshToken);

          set({ user: payload.user, isLoading: false, error: null });
        } catch (err: any) {
          const message = err?.message ?? "Login failed. Please try again.";
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoggingOut: true });
        try {
          await authApi.logout();
        } catch {
          // Silently fail — still clear local state
        } finally {
          tokenStorage.clear();
          set({ user: null, isLoggingOut: false, error: null });
          window.location.href = "/login";
        }
      },

      setUser: (user) => set({ user }),

      refreshUser: async () => {
        try {
          const { data } = await authApi.me();
          set({ user: data.data });
        } catch {
          // Token invalid — let the interceptor handle redirect
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "thrive:auth",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

// ── Convenience selectors ─────────────────────────────────────────────────────

export const useUser = () => useAuthStore((s) => s.user);
export const useIsLoggedIn = () => useAuthStore((s) => !!s.user);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useAuthError = () => useAuthStore((s) => s.error);
