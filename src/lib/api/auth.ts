import api from "./client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    isSuperAdmin: boolean;
    roles: string[];
  };
}

export interface ForgotPasswordPayload {
  email: string;
}
export interface ResetPasswordPayload {
  token: string;
  password: string;
}
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
export interface AcceptInvitePayload {
  token: string;
  password: string;
  fullName: string;
}

const authApi = {
  login: (payload: LoginPayload) =>
    api.post<{ data: AuthResponse }>("/auth/login", payload),

  logout: () => api.post("/auth/logout"),

  refresh: (refreshToken: string) =>
    api.post<{ data: AuthResponse }>("/auth/refresh", { refreshToken }),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post("/auth/forgot-password", payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    api.post("/auth/reset-password", payload),

  changePassword: (payload: ChangePasswordPayload) =>
    api.post("/auth/change-password", payload),

  acceptInvite: (payload: AcceptInvitePayload) =>
    api.post<{ data: AuthResponse }>("/auth/accept-invite", payload),

  me: () => api.get<{ data: AuthResponse["user"] }>("/auth/me"),

  getPermissions: () => api.get<{ data: string[] }>("/auth/permissions"),
};

export default authApi;
