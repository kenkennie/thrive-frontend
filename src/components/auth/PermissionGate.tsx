"use client";

import { useAuthStore } from "@/stores/auth.store";
import { usePermissionsStore } from "@/stores/permissions.store";

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  /** all = must have all, any = must have at least one (default: any) */
  mode?: "all" | "any";
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders children only if the user has the required permission(s).
 * Super admins always pass.
 *
 * Usage:
 *   <PermissionGate permission="invoices:void">
 *     <Button>Void Invoice</Button>
 *   </PermissionGate>
 */
export function PermissionGate({
  permission,
  permissions,
  mode = "any",
  children,
  fallback = null,
}: PermissionGateProps) {
  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin ?? false);
  const hasAny = usePermissionsStore((s) => s.hasAny);
  const hasAll = usePermissionsStore((s) => s.hasAll);
  const hasPermission = usePermissionsStore((s) => s.hasPermission);

  if (isSuperAdmin) return <>{children}</>;

  const perms = permissions ?? (permission ? [permission] : []);
  if (perms.length === 0) return <>{children}</>;

  const allowed = mode === "all" ? hasAll(perms) : hasAny(perms);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
