import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AuthResponse, RefreshTokenResponse, User } from "@/types/auth.types";
import { monitorApiRequest } from "./performance-monitor";

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

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";
const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const TOKEN_EXPIRES_AT_KEY = "tokenExpiresAt";

/** Sessiya tugab, uni yangilab bo'lmaganda `window` ga yuboriladigan hodisa nomi (AuthProvider tinglaydi). */
export const SESSION_EXPIRED_EVENT = "auth:session-expired";

/** So'rov sozlamasiga qo'shiladigan ichki belgilar. */
interface AuthRequestFlags {
  /** Token yangilash so'rovi: Authorization sarlavhasi access token bilan almashtirilmaydi */
  __isRefresh?: boolean;
  /** 401 dan keyin bir marta qayta yuborilgan so'rov: ikkinchi marta yangilashga urinmaymiz */
  __retried?: boolean;
  __performanceMonitor?: { complete: () => void };
}
type AuthRequestConfig = InternalAxiosRequestConfig & AuthRequestFlags;

/** 401 qaytsa ham token yangilash kerak bo'lmagan manzillar: bu yerda 401 "login/parol xato" degani. */
const AUTH_ENDPOINTS = ["/auth/login", "/auth/hemis/", "/auth/refresh-token", "/auth/logout", "/auth/forgot-password", "/auth/reset-password"];
const isAuthEndpoint = (url: string | undefined): boolean => !!url && AUTH_ENDPOINTS.some((path) => url.includes(path));

let refreshTokenPromise: Promise<RefreshTokenResponse> | null = null;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor: Add auth token and start performance monitoring
api.interceptors.request.use(
  (config: AuthRequestConfig) => {
    // Token yangilash so'rovi refresh tokenni o'zi qo'yadi: uni access token bilan almashtirib yubormaymiz.
    const token = getToken();
    if (token && config.headers && !config.__isRefresh) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Start performance monitoring for this request
    const url = config.url || 'unknown';
    const method = config.method?.toUpperCase() || 'GET';
    config.__performanceMonitor = monitorApiRequest(url, method);

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor: Complete performance monitoring
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Complete performance monitoring
    (response.config as AuthRequestConfig).__performanceMonitor?.complete();
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as AuthRequestConfig | undefined;
    // Complete performance monitoring even on error
    config?.__performanceMonitor?.complete();

    // Access token muddati tugagan: refresh token bilan yangisini olib, shu so'rovni bir marta qayta yuboramiz.
    // Bir vaqtda kelgan bir nechta 401 bitta yangilash so'rovini kutadi (refreshToken() single-flight).
    if (
      error.response?.status === 401 && config && !config.__isRefresh && !config.__retried
      && !isAuthEndpoint(config.url) && getRefreshToken()
    ) {
      config.__retried = true;
      try {
        const tokens = await refreshToken();
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return api.request(config);
      } catch {
        // Yangilab bo'lmadi: sessiya haqiqatan tugagan. Ilova holatini AuthProvider tozalaydi.
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }
    }

    // Xato matni foydalanuvchiga tushunarli bo'lsin: "Request failed with status code 400" / "Network Error"
    // o'rniga backend bergan xabar yoki o'zbekcha izoh. error.response o'zgarmaydi.
    error.message = friendlyErrorMessage(error);
    return Promise.reject(error);
  }
);

/** Axios xatosidan foydalanuvchiga ko'rsatiladigan matn: backend xabari, bo'lmasa holat kodi bo'yicha o'zbekcha izoh. */
export function friendlyErrorMessage(error: AxiosError): string {
  const data = error.response?.data as { message?: unknown; error?: unknown; detail?: unknown } | string | undefined;
  const fromServer = typeof data === "string"
    ? data
    : [data?.message, data?.detail, data?.error].find((v): v is string => typeof v === "string" && v.trim().length > 0);
  if (fromServer && !/^(Bad Request|Forbidden|Unauthorized|Not Found|Internal Server Error|Conflict)$/i.test(fromServer.trim())) {
    return fromServer.trim();
  }
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") return "So'rov vaqti tugadi. Internet aloqasini tekshirib, qayta urinib ko'ring.";
  if (!error.response) return "Server bilan aloqa yo'q. Internet aloqasini yoki serverni tekshiring.";
  switch (error.response.status) {
    case 400: return "Kiritilgan ma'lumotlar noto'g'ri. Maydonlarni tekshiring.";
    case 401: return "Sessiya tugagan. Tizimga qayta kiring.";
    case 403: return "Bu amal uchun sizda ruxsat yo'q.";
    case 404: return "Ma'lumot topilmadi. U o'chirilgan bo'lishi mumkin.";
    case 409: return "Bunday yozuv allaqachon bor yoki u boshqa yozuvlar bilan bog'langan.";
    case 413: return "Fayl hajmi juda katta.";
    case 429: return "So'rovlar juda ko'p. Biroz kutib, qayta urinib ko'ring.";
    default:
      return error.response.status >= 500
        ? "Serverda xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring."
        : error.message || "Amalni bajarib bo'lmadi.";
  }
}

export async function login(credentials: LoginRequest): Promise<AxiosResponse<AuthResponse>> {
  try {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    const payload = response.data.data;

    if (!response.data.success || !payload?.accessToken) {
      throw new Error(response.data.message || "Tizimga kirib bo'lmadi: server token qaytarmadi.");
    }

    storeAuthData(payload);
    localStorage.setItem("user", JSON.stringify(payload.user));
    api.defaults.headers.common.Authorization = `Bearer ${payload.accessToken}`;

    return response;
  } catch (error) {
    clearAuthData();

    if (axios.isAxiosError(error)) {
      let errorMessage = "Tizimga kirib bo'lmadi";

      if (error.code === "ECONNABORTED") {
        errorMessage = "So'rov vaqti tugadi. Internet aloqasini tekshirib, qayta urinib ko'ring.";
      } else if (!error.response) {
        errorMessage = "Serverga ulanib bo'lmadi. Internet aloqasini tekshiring yoki birozdan so'ng qayta urinib ko'ring.";
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

    throw error instanceof Error ? error : new Error("Tizimga kirishda kutilmagan xatolik yuz berdi");
  }
}

/** student — talabalar HEMIS OAuth, employee — o'qituvchilar (xodimlar) HEMIS OAuth. */
export function getHemisOAuthStartUrl(kind: "student" | "employee" = "student"): string {
  const backendBase = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${backendBase}/oauth2/authorization/${kind === "employee" ? "hemis-employee" : "hemis"}`;
}

export interface HemisLoginOptions {
  studentPasswordLogin: boolean;
  studentOAuth: boolean;
  employeeOAuth: boolean;
}

export async function getHemisLoginOptions(): Promise<HemisLoginOptions> {
  const response = await api.get<{ success: boolean; data: HemisLoginOptions }>("/auth/hemis/options");
  return response.data.data;
}

/** Talaba HEMIS login va paroli bilan kirish. */
export async function hemisPasswordLogin(login: string, password: string): Promise<AuthResponse["data"]> {
  try {
    const response = await api.post<AuthResponse>("/auth/hemis/login", { login, password });
    const payload = response.data.data;
    if (!response.data.success || !payload?.accessToken) {
      throw new Error(response.data.message || "HEMIS orqali kirish yakunlanmadi");
    }
    storeAuthData(payload);
    localStorage.setItem("user", JSON.stringify(payload.user));
    api.defaults.headers.common.Authorization = `Bearer ${payload.accessToken}`;
    return payload;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (!error.response) throw new Error("Serverga ulanib bo'lmadi. Internet aloqasini tekshiring.");
      throw new Error(error.response.data?.message || "HEMIS login yoki parol noto'g'ri");
    }
    throw error instanceof Error ? error : new Error("HEMIS orqali kirishda xatolik");
  }
}

export async function exchangeHemisOAuthCode(code: string): Promise<AuthResponse["data"]> {
  const response = await api.post<AuthResponse>("/auth/hemis/exchange", { code });
  const payload = response.data.data;
  if (!response.data.success || !payload?.accessToken) {
    throw new Error(response.data.message || "HEMIS orqali kirish yakunlanmadi");
  }

  storeAuthData(payload);
  localStorage.setItem("user", JSON.stringify(payload.user));
  api.defaults.headers.common.Authorization = `Bearer ${payload.accessToken}`;
  return payload;
}

export async function refreshToken(): Promise<RefreshTokenResponse> {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    clearAuthData();
    throw new Error("Sessiya tugagan. Tizimga qayta kiring.");
  }

  const refreshConfig: AxiosRequestConfig & AuthRequestFlags = {
    headers: { Authorization: `Bearer ${currentRefreshToken}` },
    __isRefresh: true,
  };

  refreshTokenPromise = api
    .post<CommonApiResponse<RefreshTokenResponse>>("/auth/refresh-token", {}, refreshConfig)
    .then((response) => {
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Sessiyani yangilab bo'lmadi");
      }

      storeTokenData(response.data.data);
      return response.data.data;
    })
    .catch((error) => {
      // Refresh token bir martalik: boshqa oynada (tab) allaqachon yangilangan bo'lsa, bu oynadagi eski
      // token rad etiladi. Bunday holda saqlangan yangi tokenlar bilan davom etamiz, chiqarib yubormaymiz.
      const storedAccess = getToken();
      const storedRefresh = getRefreshToken();
      if (storedAccess && storedRefresh && storedRefresh !== currentRefreshToken) {
        return { accessToken: storedAccess, refreshToken: storedRefresh } as RefreshTokenResponse;
      }
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
    throw new Error(response.data.message || "Foydalanuvchi ma'lumotini yuklab bo'lmadi");
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

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
  await api.post("/auth/reset-password", { token, newPassword });
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
