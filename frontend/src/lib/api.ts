import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AuthResponse, RefreshTokenResponse, User } from "@/types/auth.types";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface CommonApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export type ApiResponse<T> = CommonApiResponse<T>;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";
const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const TOKEN_EXPIRES_AT_KEY = "tokenExpiresAt";

let refreshTokenPromise: Promise<RefreshTokenResponse> | null = null;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

export async function login(credentials: LoginRequest): Promise<AxiosResponse<AuthResponse>> {
  try {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    const payload = response.data.data;

    if (!response.data.success || !payload?.accessToken) {
      throw new Error(response.data.message || "Authentication failed: no token received");
    }

    storeAuthData(payload);
    localStorage.setItem("user", JSON.stringify(payload.user));
    api.defaults.headers.common.Authorization = `Bearer ${payload.accessToken}`;

    return response;
  } catch (error) {
    clearAuthData();

    if (axios.isAxiosError(error)) {
      let errorMessage = "Authentication failed";

      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timeout. Please check your internet connection.";
      } else if (!error.response) {
        errorMessage = "Cannot connect to server. Please check your internet connection or try again later.";
      } else if (error.response.status === 401) {
        errorMessage = "Login yoki parol noto'g'ri";
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }

    throw error instanceof Error ? error : new Error("An unexpected error occurred during login");
  }
}

export async function refreshToken(): Promise<RefreshTokenResponse> {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    clearAuthData();
    throw new Error("No refresh token available");
  }

  refreshTokenPromise = api
    .post<CommonApiResponse<RefreshTokenResponse>>(
      "/auth/refresh-token",
      {},
      {
        headers: {
          Authorization: `Bearer ${currentRefreshToken}`,
        },
      }
    )
    .then((response) => {
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Token refresh failed");
      }

      storeTokenData(response.data.data);
      return response.data.data;
    })
    .catch((error) => {
      clearAuthData();
      throw error;
    })
    .finally(() => {
      refreshTokenPromise = null;
    });

  return refreshTokenPromise;
}

export const refreshAccessToken = refreshToken;

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<CommonApiResponse<User>>("/auth/me");
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Failed to load current user");
  }
  localStorage.setItem("user", JSON.stringify(response.data.data));
  return response.data.data;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  const expiresAt = localStorage.getItem(TOKEN_EXPIRES_AT_KEY);
  const isExpired = expiresAt ? Number(expiresAt) <= Date.now() : false;

  if (!isExpired) return true;

  try {
    await refreshToken();
    return true;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  const currentRefreshToken = getRefreshToken();

  try {
    if (currentRefreshToken) {
      await api.post("/auth/logout", { refreshToken: currentRefreshToken });
    }
  } finally {
    clearAuthData();
  }
}

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export function clearAuthData(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
  localStorage.removeItem("user");
  delete api.defaults.headers.common.Authorization;
}

function storeAuthData(authData: { accessToken: string; refreshToken: string; expiresIn: number }): void {
  storeTokenData(authData);
}

function storeTokenData(authData: { accessToken: string; refreshToken: string; expiresIn?: number }): void {
  localStorage.setItem(TOKEN_KEY, authData.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken);

  if (authData.expiresIn) {
    const expiresAt = Date.now() + authData.expiresIn * 1000;
    localStorage.setItem(TOKEN_EXPIRES_AT_KEY, expiresAt.toString());
  }
}

export default api;
