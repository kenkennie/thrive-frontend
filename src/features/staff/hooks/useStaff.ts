// src/features/staff/hooks/useStaff.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import staffApi from "@/lib/api/staff";
import { extractArray, extractItem } from "@/lib/api/response";

const inv = (qc: any, keys: string[][]) =>
  keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));

// ── Staff ─────────────────────────────────────────────────────────────────────
export const useStaffList = (p?: any) =>
  useQuery({
    queryKey: ["staff", "list", p],
    queryFn: () => staffApi.list(p),
    select: (r) => ({ data: extractArray(r), meta: (r as any)?.data?.meta }),
  });
export const useStaffMember = (id: string) =>
  useQuery({
    queryKey: ["staff", id],
    queryFn: () => staffApi.getById(id),
    enabled: !!id,
    select: (r) => extractItem<any>(r),
  });
export const useInviteList = (p?: any) =>
  useQuery({
    queryKey: ["staff", "invites", p],
    queryFn: () => staffApi.listInvites(p),
    select: (r) => extractArray(r),
  });

// ── Roles ─────────────────────────────────────────────────────────────────────
export const useAllRoles = () =>
  useQuery({
    queryKey: ["roles"],
    queryFn: () => staffApi.getAllRoles(),
    select: (r) => extractArray(r),
  });
export const useRoles = () =>
  useQuery({
    queryKey: ["roles"],
    queryFn: () => staffApi.getAllRoles(),
    select: (r) => extractArray(r),
  });
export const useRole = (id: string) =>
  useQuery({
    queryKey: ["roles", id],
    queryFn: () => staffApi.getRoleById(id),
    enabled: !!id,
    select: (r) => extractItem<any>(r),
  });
export const useUserRoles = (id: string) =>
  useQuery({
    queryKey: ["staff", id, "roles"],
    queryFn: () => staffApi.getUserRoles(id),
    enabled: !!id,
    select: (r) => extractArray(r),
  });

// ── Permissions ───────────────────────────────────────────────────────────────
// Flat array — used by role picker (PermissionPicker component)
export const useAllPermissions = () =>
  useQuery({
    queryKey: ["permissions", "flat"],
    queryFn: () => staffApi.getAllPermissions(),
    select: (r) => extractArray(r),
  });
// Grouped object — used by permission overrides UI
export const useAllPermissionsGrouped = () =>
  useQuery({
    queryKey: ["permissions", "grouped"],
    queryFn: () => staffApi.getAllPermissionsGrouped(),
    select: (r) => (r as any)?.data?.data ?? {},
  });
export const useEffectivePermissions = (id: string) =>
  useQuery({
    queryKey: ["staff", id, "permissions"],
    queryFn: () => staffApi.getEffective(id),
    enabled: !!id,
    select: (r) => extractItem<any>(r),
  });
export const useUserOverrides = (id: string) =>
  useQuery({
    queryKey: ["staff", id, "overrides"],
    queryFn: () => staffApi.getEffective(id),
    enabled: !!id,
    select: (r) => extractArray(r),
  });

// ── Schedule ──────────────────────────────────────────────────────────────────
export const useSchedule = (id: string) =>
  useQuery({
    queryKey: ["staff", id, "schedule"],
    queryFn: () => staffApi.getSchedule(id),
    enabled: !!id,
    select: (r) => extractArray(r),
  });
export const useBlockedSlots = (id: string) =>
  useQuery({
    queryKey: ["staff", id, "blocked"],
    queryFn: () => staffApi.listBlocked(id),
    enabled: !!id,
    select: (r) => extractArray(r),
  });

// ── Staff mutations ───────────────────────────────────────────────────────────
export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: staffApi.create,
    onSuccess: () => {
      toast.success("Staff member created");
      inv(qc, [["staff", "list"]]);
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? e?.message ?? "Failed"),
  });
}
export function useInviteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: staffApi.invite,
    onSuccess: () => {
      toast.success("Invitation sent");
      inv(qc, [["staff", "invites"]]);
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? e?.message ?? "Failed"),
  });
}
export function useCancelInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.cancelInvite(id),
    onSuccess: () => {
      toast.success("Invitation cancelled");
      inv(qc, [["staff", "invites"]]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
export function useResendInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.resendInvite(id),
    onSuccess: () => {
      toast.success("Invitation resent");
      inv(qc, [["staff", "invites"]]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
export function useUpdateStaff(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => staffApi.update(id, dto),
    onSuccess: () => {
      toast.success("Updated");
      inv(qc, [
        ["staff", id],
        ["staff", "list"],
      ]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
export function useDeactivateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.deactivate(id),
    onSuccess: () => {
      toast.success("Account deactivated");
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
export function useActivateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.activate(id),
    onSuccess: () => {
      toast.success("Account activated");
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
export function useResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.resetPassword(id),
    onSuccess: () => toast.success("Password reset email sent"),
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

// ── Role mutations ────────────────────────────────────────────────────────────
export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => staffApi.createRole(dto),
    onSuccess: () => {
      toast.success("Role created");
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (e: any) =>
      toast.error(
        e?.response?.data?.message ?? e?.message ?? "Failed to create role",
      ),
  });
}
export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: any) => staffApi.updateRole(id, dto),
    onSuccess: (_, { id }) => {
      toast.success("Role updated");
      inv(qc, [["roles"], ["roles", id]]);
    },
    onError: (e: any) =>
      toast.error(
        e?.response?.data?.message ?? e?.message ?? "Failed to update role",
      ),
  });
}
export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.deleteRole(id),
    onSuccess: () => {
      toast.success("Role deleted");
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (e: any) =>
      toast.error(
        e?.response?.data?.message ??
          e?.message ??
          "Cannot delete — users may be assigned",
      ),
  });
}
export function useAssignRole(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) => staffApi.assignRole(userId, roleId),
    onSuccess: () => {
      toast.success("Role assigned");
      inv(qc, [
        ["staff", userId, "roles"],
        ["staff", userId, "permissions"],
      ]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
export function useRemoveRole(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) => staffApi.removeRole(userId, roleId),
    onSuccess: () => {
      toast.success("Role removed");
      inv(qc, [
        ["staff", userId, "roles"],
        ["staff", userId, "permissions"],
      ]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
export function useBulkOverride(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (overrides: any[]) => staffApi.bulkOverride(userId, overrides),
    onSuccess: () => {
      toast.success("Permissions saved");
      inv(qc, [["staff", userId, "permissions"]]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
export function useRemoveOverride(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (permId: string) => staffApi.removeOverride(userId, permId),
    onSuccess: () => {
      toast.success("Override removed");
      inv(qc, [["staff", userId, "overrides"]]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
export function useSetPermissionOverride(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ permissionId, granted }: { permissionId: string; granted: boolean }) =>
      staffApi.setOverride(userId, { permissionId, granted }),
    onSuccess: () => {
      inv(qc, [["staff", userId, "overrides"]]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
export function useDeletePermissionOverride(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (permissionId: string) => staffApi.removeOverride(userId, permissionId),
    onSuccess: () => {
      inv(qc, [["staff", userId, "overrides"]]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
export function useSaveSchedule(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (days: any[]) => staffApi.updateSchedule(userId, days),
    onSuccess: () => {
      toast.success("Schedule saved");
      inv(qc, [["staff", userId, "schedule"]]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
export function useAddBlocked(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => staffApi.addBlocked(userId, dto),
    onSuccess: () => {
      toast.success("Slot blocked");
      inv(qc, [["staff", userId, "blocked"]]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
export function useRemoveBlocked(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.removeBlocked(userId, id),
    onSuccess: () => {
      toast.success("Slot removed");
      inv(qc, [["staff", userId, "blocked"]]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
