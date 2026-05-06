"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { usePermissionsStore } from "@/stores/permissions.store";
import { Loader2 } from "lucide-react";

interface RequireAuthProps {
  children: React.ReactNode;
  /** If provided, user must have at least one of these permissions */
  permissions?: string[];
  /** Redirect if permission check fails (default: '/') */
  fallback?: string;
}

export function RequireAuth({
  children,
  permissions,
  fallback = "/",
}: RequireAuthProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoaded = usePermissionsStore((s) => s.isLoaded);
  const hasAny = usePermissionsStore((s) => s.hasAny);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (permissions && isLoaded && !user.isSuperAdmin) {
      const allowed = hasAny(permissions);
      if (!allowed) router.replace(fallback);
    }
  }, [user, isLoaded]);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (permissions && !isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
