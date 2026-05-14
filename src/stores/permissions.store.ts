import { create } from "zustand";
import authApi from "@/lib/api/auth";

interface PermissionsState {
  permissions: Set<string>;
  isLoaded: boolean;

  load: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAny: (permissions: string[]) => boolean;
  hasAll: (permissions: string[]) => boolean;
  clear: () => void;
}

export const usePermissionsStore = create<PermissionsState>()((set, get) => ({
  permissions: new Set(),
  isLoaded: false,

   load: async () => {
     try {
       const { data } = await authApi.getPermissions();
       // Backend returns { success: true, data: { effectivePermissions: [{ permission: { name }, granted }, ...] } }
       // We need a flat Set of permission names where granted === true.
       let permNames: string[] = [];
       if (Array.isArray(data.data)) {
         // Legacy shape: array of permission name strings
         permNames = data.data;
       } else if (data.data?.effectivePermissions) {
         permNames = data.data.effectivePermissions
           .filter((p: any) => p.granted)
           .map((p: any) => p.permission?.name)
           .filter(Boolean);
       }
       set({ permissions: new Set(permNames), isLoaded: true });
     } catch {
       set({ permissions: new Set(), isLoaded: true });
     }
   },

  hasPermission: (permission) => {
    const { permissions } = get();
    return permissions.has(permission);
  },

  hasAny: (perms) => {
    const { permissions } = get();
    return perms.some((p) => permissions.has(p));
  },

  hasAll: (perms) => {
    const { permissions } = get();
    return perms.every((p) => permissions.has(p));
  },

  clear: () => set({ permissions: new Set(), isLoaded: false }),
}));

// ── Hook shorthand ────────────────────────────────────────────────────────────

export const usePermission = (permission: string) =>
  usePermissionsStore((s) => s.hasPermission(permission));

export const useHasAnyPermission = (permissions: string[]) =>
  usePermissionsStore((s) => s.hasAny(permissions));
