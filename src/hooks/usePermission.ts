import { usePermissionsStore } from "@/stores/permissions.store";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Returns true if the authenticated user has the given permission.
 * Super admins always return true regardless of permission.
 */
export function usePermission(permission: string): boolean {
  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin ?? false);
  const hasPermission = usePermissionsStore((s) => s.hasPermission);
  if (isSuperAdmin) return true;
  return hasPermission(permission);
}

/**
 * Returns true if the user has at least one of the given permissions.
 */
export function useHasAnyPermission(permissions: string[]): boolean {
  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin ?? false);
  const hasAny = usePermissionsStore((s) => s.hasAny);
  if (isSuperAdmin) return true;
  return hasAny(permissions);
}

/**
 * Returns true if the user has ALL of the given permissions.
 */
export function useHasAllPermissions(permissions: string[]): boolean {
  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin ?? false);
  const hasAll = usePermissionsStore((s) => s.hasAll);
  if (isSuperAdmin) return true;
  return hasAll(permissions);
}
