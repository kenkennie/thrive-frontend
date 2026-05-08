import { create } from "zustand";
import { persist } from "zustand/middleware";
import { tokenStorage } from "@/lib/api/client";
import authApi, { type AuthUser } from "@/lib/api/auth";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  error: string | null;
  _hasHydrated: boolean; // ← add this

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  setHasHydrated: (v: boolean) => void; // ← add this
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isLoggingOut: false,
      error: null,
      _hasHydrated: false, // ← starts false

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const payload = await authApi.login({ email, password });
          tokenStorage.setTokens(payload.accessToken, payload.refreshToken);

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
      // ← this fires once rehydration from localStorage is done
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export const useUser = () => useAuthStore((s) => s.user);
export const useIsLoggedIn = () => useAuthStore((s) => !!s.user);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useAuthError = () => useAuthStore((s) => s.error);
export const useHasHydrated = () => useAuthStore((s) => s._hasHydrated); // ← export
