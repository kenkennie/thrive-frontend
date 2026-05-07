import api from "./client";

// ─── Backend response shapes (match exactly what the backend returns) ─────────

export interface LoginPayload {
  email: string;
  password: string;
}

/** Raw shape from POST /auth/login */
interface LoginResponseData {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    isSuperAdmin: boolean;
    roles: string[];
  };
  access_token: string; // snake_case — backend uses this
  refresh_token: string; // snake_case — backend uses this
}

/** Normalised shape used throughout the frontend */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  isSuperAdmin: boolean;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  isSuperAdmin: boolean;
  roles: string[];
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

// ─── Normaliser — converts snake_case tokens → camelCase ─────────────────────

function normaliseAuth(raw: LoginResponseData): AuthResponse {
  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    user: raw.user,
    isSuperAdmin: false, // will be filled by /auth/me
    roles: [],
  };
}

// ─── API ──────────────────────────────────────────────────────────────────────

const authApi = {
  /**
   * Returns a normalised AuthResponse regardless of whether the backend
   * sends access_token or accessToken.
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post<{
      success: boolean;
      data: LoginResponseData;
    }>("/auth/login", payload);

    // data.data is the actual payload (Axios wraps in .data, backend wraps in .data)
    const raw = data.data;
    return normaliseAuth(raw);
  },

  logout: () => api.post("/auth/logout"),

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const { data } = await api.post<{
      success: boolean;
      data: LoginResponseData;
    }>("/auth/refresh", { token: refreshToken });
    return normaliseAuth(data.data);
  },

  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post("/auth/forgot-password", payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    api.post("/auth/reset-password", payload),

  changePassword: (payload: ChangePasswordPayload) =>
    api.post("/auth/change-password", payload),

  acceptInvite: async (payload: AcceptInvitePayload): Promise<AuthResponse> => {
    const { data } = await api.post<{
      success: boolean;
      data: LoginResponseData;
    }>("/auth/accept-invite", payload);
    return normaliseAuth(data.data);
  },

  me: () => api.post<{ success: boolean; data: AuthUser }>("/auth/me"),

  getPermissions: () =>
    api.get<{ success: boolean; data: string[] }>(
      "/permissions/me/permissions",
    ),
};

export default authApi;
