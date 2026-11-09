import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QueryClientContext } from "@tanstack/react-query";
import { AuthResponse, User } from "@/types/auth.types";
import {
  clearAuthData,
  getCurrentUser,
  getToken,
  isAuthenticated as apiCheck,
  login as apiLogin,
  logout as apiLogout,
  SESSION_EXPIRED_EVENT,
} from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  checkAuthStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  // Ixtiyoriy: testlarda QueryClientProvider bo'lmasligi mumkin
  const queryClient = useContext(QueryClientContext);

  const clearAuthState = useCallback(() => {
    clearAuthData();
    // Keshdagi ma'lumot oldingi foydalanuvchiniki: umumiy kompyuterda keyingi odam ko'rmasligi kerak
    queryClient?.clear();
    setUser(null);
    setIsAuthenticated(false);
  }, [queryClient]);

  // Sessiya tugadi (token yangilab bo'lmadi) yoki boshqa oynada tizimdan chiqildi
  useEffect(() => {
    const onSessionExpired = () => {
      clearAuthState();
      navigate("/login", { replace: true });
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === "token" && event.newValue === null) onSessionExpired();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
      window.removeEventListener("storage", onStorage);
    };
  }, [clearAuthState, navigate]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const hasValidToken = await apiCheck();

        if (!isMounted) return;

        if (!hasValidToken || !getToken()) {
          clearAuthState();
          return;
        }

        const savedUser = localStorage.getItem("user");
        const rawUser = savedUser ? (JSON.parse(savedUser) as User) : await getCurrentUser();
        const currentUser = normalizeUser(rawUser);

        if (!isMounted) return;

        setUser(currentUser);
        setIsAuthenticated(true);

        // Saqlangan nusxa tez ochilish uchun; rollar o'zgargan bo'lishi mumkin, shuning uchun serverdan yangilaymiz.
        if (savedUser) {
          getCurrentUser()
            .then((fresh) => { if (isMounted) setUser(normalizeUser(fresh)); })
            .catch(() => undefined);
        }
      } catch {
        if (isMounted) {
          clearAuthState();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [clearAuthState]);

  const login = async (username: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true);

    try {
      const response = await apiLogin({ username, password });
      const payload = response.data.data;

      if (!response.data.success || !payload) {
        return {
          success: false,
          message: response.data.message || "Tizimga kirib bo'lmadi",
        };
      }

      const normalizedUser = normalizeUser(payload.user);
      setUser(normalizedUser);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(normalizedUser));

      return response.data;
    } catch (error) {
      clearAuthState();
      return {
        success: false,
        message: error instanceof Error ? error.message : "Tizimga kirib bo'lmadi",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      const authStatus = await apiCheck();
      setIsAuthenticated(authStatus);

      if (authStatus && !user) {
        const rawUser = await getCurrentUser();
        setUser(normalizeUser(rawUser));
      }

      return authStatus;
    } catch {
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  };

  const logout = () => {
    apiLogout().finally(() => {
      clearAuthState();
      navigate("/login", { replace: true });
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

function normalizeUser(raw: User): User {
  const roles = raw.roles?.length
    ? raw.roles
    : raw.role
    ? [raw.role]
    : [];
  return { ...raw, roles };
}
