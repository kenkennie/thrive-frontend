import api from "./client";

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  lastLoginAt?: string;
  createdAt: string;
  emailVerifiedAt?: string;
  userRoles: { role: { id: string; name: string; displayName: string } }[];
  staffProfile?: {
    specialisation?: string;
    licenseNumber?: string;
  };
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  _count?: { userRoles: number; rolePermissions: number };
  rolePermissions?: { permission: Permission }[];
}

export interface Permission {
  id: string;
  name: string;
  displayName: string;
  module: string;
  action: string;
  description?: string;
}

export interface UserPermissionOverride {
  id: string;
  granted: boolean;
  permission: Permission;
  createdAt: string;
}

export interface InviteStaffDto {
  email: string;
  fullName: string;
  roleIds: string[];
}

export interface CreateRoleDto {
  name: string;
  displayName: string;
  description?: string;
  permissionIds: string[];
}

const staffApi = {
  // Users
  list: (params?: any) => api.get("/users", { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (dto: any) => api.post("/users", dto),
  update: (id: string, dto: any) => api.patch(`/users/${id}`, dto),
  deactivate: (id: string) => api.patch(`/users/${id}/deactivate`),
  activate: (id: string) => api.patch(`/users/${id}/activate`),
  resetPassword: (id: string) => api.post(`/users/${id}/reset-password`),

  // Invitations
  invite: (dto: any) => api.post("/users/invite", dto),
  cancelInvite: (id: string) => api.delete(`/users/invitations/${id}`),
  resendInvite: (id: string) => api.post(`/users/invitations/${id}/resend`),
  listInvites: (params?: any) => api.get("/users/invitations", { params }),

  // Roles
  getAllRoles: () => api.get("/permissions/roles"),
  getUserRoles: (userId: string) =>
    api.get(`/permissions/users/${userId}/roles`),
  assignRole: (userId: string, roleId: string) =>
    api.post(`/permissions/users/${userId}/roles`, { roleId }),
  removeRole: (userId: string, roleId: string) =>
    api.delete(`/permissions/users/${userId}/roles/${roleId}`),

  // Permissions
  getAllPermissions: () => api.get("/permissions?grouped=true"),
  getEffective: (userId: string) =>
    api.get(`/permissions/users/${userId}/permissions`),
  setOverride: (userId: string, dto: any) =>
    api.post(`/permissions/users/${userId}/permissions/override`, dto),
  bulkOverride: (userId: string, overrides: any[]) =>
    api.post(`/permissions/users/${userId}/permissions/override/bulk`, {
      overrides,
    }),
  removeOverride: (userId: string, permId: string) =>
    api.delete(`/permissions/users/${userId}/permissions/${permId}/override`),

  // Schedule
  getSchedule: (userId: string) => api.get(`/staff/${userId}/schedule`),
  updateSchedule: (userId: string, days: any[]) =>
    api.put(`/staff/${userId}/schedule`, { days }),
  listBlocked: (userId: string) => api.get(`/staff/${userId}/blocked-slots`),
  addBlocked: (userId: string, dto: any) =>
    api.post(`/staff/${userId}/blocked-slots`, dto),
  removeBlocked: (userId: string, id: string) =>
    api.delete(`/staff/${userId}/blocked-slots/${id}`),
};

export default staffApi;
