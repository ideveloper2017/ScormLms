import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthResponse, User } from "@/types/auth.types";
import {
  clearAuthData,
  getCurrentUser,
  getToken,
  isAuthenticated as apiCheck,
  login as apiLogin,
  logout as apiLogout,
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

  const clearAuthState = useCallback(() => {
    clearAuthData();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

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
          message: response.data.message || "Login failed",
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
        message: error instanceof Error ? error.message : "Login failed",
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
