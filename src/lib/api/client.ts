import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000") + "/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

// ── Token storage ─────────────────────────────────────────────────────────────

const TOKEN_KEY = "thrive:access_token";
const REFRESH_KEY = "thrive:refresh_token";

export const tokenStorage = {
  getAccess: () =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
  getRefresh: () =>
    typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null,
  setAccess: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  setRefresh: (t: string) => localStorage.setItem(REFRESH_KEY, t),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    // FIX: also set on axios defaults immediately so subsequent calls use it
    api.defaults.headers.common.Authorization = `Bearer ${access}`;
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    delete api.defaults.headers.common.Authorization;
  },
};

// ── Hydrate token from localStorage on module load ───────────────────────
// This runs once when the module is first imported (client-side only).
// Without this, the first render after a page refresh has no token set
// on the axios instance even though localStorage has it.
if (typeof window !== "undefined") {
  const saved = localStorage.getItem(TOKEN_KEY);
  if (saved) {
    api.defaults.headers.common.Authorization = `Bearer ${saved}`;
  }
}

// ── Request interceptor ───────────────────────────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Always read fresh from localStorage (covers cases where setTokens was
    // called but the axios default header wasn't updated)
    const token = tokenStorage.getAccess();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor — 401 + token refresh ───────────────────────────────

let isRefreshing = false;
let refreshQueue: {
  resolve: (t: string) => void;
  reject: (e: unknown) => void;
}[] = [];

function processQueue(error: unknown, token: string | null): void {
  refreshQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401, and not on the refresh endpoint itself
    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(parseApiError(error));
    }

    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken) {
      redirectToLogin();
      return Promise.reject(parseApiError(error));
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token) => {
            original.headers!.Authorization = `Bearer ${token}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        token: refreshToken,
      });

      const { accessToken, refreshToken: newRefresh } = data.data ?? data;

      tokenStorage.setTokens(accessToken, newRefresh);
      processQueue(null, accessToken);

      original.headers!.Authorization = `Bearer ${accessToken}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      tokenStorage.clear();
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Error parser ──────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export function parseApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    return {
      message: data?.message ?? error.message ?? "An unexpected error occurred",
      statusCode: error.response?.status ?? 0,
      errors: data?.errors,
    };
  }
  return { message: "An unexpected error occurred", statusCode: 0 };
}

function redirectToLogin(): void {
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/login")
  ) {
    window.location.href = "/login";
  }
}

export default api;
