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
  // Staff
  list: (params?: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => api.get("/users", { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  invite: (dto: InviteStaffDto) => api.post("/users/invite", dto),
  update: (id: string, dto: any) => api.patch(`/users/${id}`, dto),
  deactivate: (id: string) => api.delete(`/users/${id}`),
  reactivate: (id: string) => api.patch(`/users/${id}/reactivate`),
  resetPassword: (id: string) => api.post(`/users/${id}/reset-password`),

  // Roles
  listRoles: () => api.get("/permissions/roles"),
  getRole: (id: string) => api.get(`/permissions/roles/${id}`),
  createRole: (dto: CreateRoleDto) => api.post("/permissions/roles", dto),
  updateRole: (id: string, dto: Partial<CreateRoleDto>) =>
    api.patch(`/permissions/roles/${id}`, dto),
  deleteRole: (id: string) => api.delete(`/permissions/roles/${id}`),

  // Role assignments
  assignRole: (userId: string, roleId: string) =>
    api.post(`/users/${userId}/roles`, { roleId }),
  revokeRole: (userId: string, roleId: string) =>
    api.delete(`/users/${userId}/roles/${roleId}`),

  // Permissions
  listPermissions: () => api.get("/permissions"),
  getUserOverrides: (userId: string) =>
    api.get(`/users/${userId}/permission-overrides`),
  setOverride: (
    userId: string,
    dto: { permissionId: string; granted: boolean },
  ) => api.post(`/users/${userId}/permission-overrides`, dto),
  deleteOverride: (userId: string, permissionId: string) =>
    api.delete(`/users/${userId}/permission-overrides/${permissionId}`),
};

export default staffApi;
