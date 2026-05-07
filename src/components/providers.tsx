"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { usePermissionsStore } from "@/stores/permissions.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useAuthStore } from "@/stores/auth.store";
import { tokenStorage } from "@/lib/api/client";

const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient(queryClientConfig));

  const user = useAuthStore((s) => s.user);
  const loadPermissions = usePermissionsStore((s) => s.load);
  const clearPermissions = usePermissionsStore((s) => s.clear);
  const loadSettings = useSettingsStore((s) => s.load);

  useEffect(() => {
    if (!user) {
      clearPermissions();
      return;
    }

    // Only load permissions and settings if we actually have a token.
    // Without this check, Zustand rehydrates the user from localStorage but
    // the token may not yet be set on the axios instance, causing 401 loops.
    const token = tokenStorage.getAccess();
    if (!token) return;

    loadPermissions();
    loadSettings();
  }, [user?.id]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
