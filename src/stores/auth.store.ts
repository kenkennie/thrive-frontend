import { create } from "zustand";
import { persist } from "zustand/middleware";
import { tokenStorage } from "@/lib/api/client";
import authApi, { type AuthUser } from "@/lib/api/auth";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isLoggingOut: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          // authApi.login returns AuthResponse directly (normalised)
          const payload = await authApi.login({ email, password });

          // Set tokens first — updates axios default header immediately
          tokenStorage.setTokens(payload.accessToken, payload.refreshToken);

          // Set session cookie for Next.js middleware
          if (typeof document !== "undefined") {
            document.cookie =
              "thrive:session=1; path=/; max-age=" +
              60 * 60 * 24 * 7 +
              "; SameSite=Lax";
          }

          set({ user: payload.user, isLoading: false, error: null });
        } catch (err) {
          const message =
            (err as any)?.message ??
            "Login failed. Please check your credentials.";
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoggingOut: true });
        try {
          await authApi.logout();
        } catch {
          /* swallow */
        } finally {
          tokenStorage.clear();
          if (typeof document !== "undefined") {
            document.cookie = "thrive:session=; path=/; max-age=0";
          }
          set({ user: null, isLoggingOut: false, error: null });
          if (typeof window !== "undefined") window.location.href = "/login";
        }
      },

      setUser: (user) => set({ user }),
      refreshUser: async () => {
        try {
          const { data } = await authApi.me();
          set({ user: data.data });
        } catch {
          /* let interceptor handle */
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

export const useUser = () => useAuthStore((s) => s.user);
export const useIsLoggedIn = () => useAuthStore((s) => !!s.user);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useAuthError = () => useAuthStore((s) => s.error);
