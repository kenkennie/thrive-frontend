"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import staffApi from "@/lib/api/staff";
import { extractArray, extractItem } from "@/lib/api/response";

export const STAFF_KEYS = {
  all: ["staff"] as const,
  list: (q: any) => ["staff", "list", q] as const,
  detail: (id: string) => ["staff", "detail", id] as const,
  roles: ["roles"] as const,
  role: (id: string) => ["roles", id] as const,
  permissions: ["permissions"] as const,
  overrides: (userId: string) => ["staff", "overrides", userId] as const,
};

export function useStaffList(query?: any) {
  return useQuery({
    queryKey: STAFF_KEYS.list(query),
    queryFn: () => staffApi.list(query),
    select: (res) => ({
      data: extractArray(res),
      meta: (res as any)?.data?.meta ?? null,
    }),
  });
}

export function useStaffMember(id: string) {
  return useQuery({
    queryKey: STAFF_KEYS.detail(id),
    queryFn: () => staffApi.getById(id),
    enabled: !!id,
    select: (res) => extractItem<any>(res),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: STAFF_KEYS.roles,
    queryFn: () => staffApi.listRoles(),
    select: (res) => extractArray(res),
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: STAFF_KEYS.role(id),
    queryFn: () => staffApi.getRole(id),
    enabled: !!id,
    select: (res) => extractItem<any>(res),
  });
}

export function useAllPermissions() {
  return useQuery({
    queryKey: STAFF_KEYS.permissions,
    queryFn: () => staffApi.listPermissions(),
    select: (res) => extractArray(res),
  });
}

export function useUserOverrides(userId: string) {
  return useQuery({
    queryKey: STAFF_KEYS.overrides(userId),
    queryFn: () => staffApi.getUserOverrides(userId),
    enabled: !!userId,
    select: (res) => extractArray(res),
  });
}

export function useInviteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: staffApi.invite,
    onSuccess: () => {
      toast.success("Invite sent");
      qc.invalidateQueries({ queryKey: STAFF_KEYS.all });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to send invite"),
  });
}

export function useDeactivateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.deactivate(id),
    onSuccess: () => {
      toast.success("Staff member deactivated");
      qc.invalidateQueries({ queryKey: STAFF_KEYS.all });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useReactivateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.reactivate(id),
    onSuccess: () => {
      toast.success("Staff member reactivated");
      qc.invalidateQueries({ queryKey: STAFF_KEYS.all });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: string) => staffApi.resetPassword(id),
    onSuccess: () => toast.success("Password reset email sent"),
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      staffApi.assignRole(userId, roleId),
    onSuccess: (_, { userId }) => {
      toast.success("Role assigned");
      qc.invalidateQueries({ queryKey: STAFF_KEYS.detail(userId) });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useRevokeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      staffApi.revokeRole(userId, roleId),
    onSuccess: (_, { userId }) => {
      toast.success("Role removed");
      qc.invalidateQueries({ queryKey: STAFF_KEYS.detail(userId) });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useSetPermissionOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      permissionId,
      granted,
    }: {
      userId: string;
      permissionId: string;
      granted: boolean;
    }) => staffApi.setOverride(userId, { permissionId, granted }),
    onSuccess: (_, { userId }) => {
      toast.success("Permission override saved");
      qc.invalidateQueries({ queryKey: STAFF_KEYS.overrides(userId) });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useDeletePermissionOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      permissionId,
    }: {
      userId: string;
      permissionId: string;
    }) => staffApi.deleteOverride(userId, permissionId),
    onSuccess: (_, { userId }) => {
      toast.success("Override removed");
      qc.invalidateQueries({ queryKey: STAFF_KEYS.overrides(userId) });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: staffApi.createRole,
    onSuccess: () => {
      toast.success("Role created");
      qc.invalidateQueries({ queryKey: STAFF_KEYS.roles });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: any) => staffApi.updateRole(id, dto),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: STAFF_KEYS.roles });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.deleteRole(id),
    onSuccess: () => {
      toast.success("Role deleted");
      qc.invalidateQueries({ queryKey: STAFF_KEYS.roles });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
