"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { usePermissionsStore } from "@/stores/permissions.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useAuthStore } from "@/stores/auth.store";

const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min
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

  // Load permissions and settings when user is authenticated
  useEffect(() => {
    if (user) {
      loadPermissions();
      loadSettings();
    } else {
      clearPermissions();
    }
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
