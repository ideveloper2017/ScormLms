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
  pendingUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AuthResponse>;
  completeLogin: (userData?: User) => void;
  logout: () => void;
  isFaceRecognitionCompleted: boolean;
  checkAuthStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFaceRecognitionCompleted, setIsFaceRecognitionCompleted] = useState(
    localStorage.getItem("faceRecognitionCompleted") === "true"
  );
  const navigate = useNavigate();

  const clearAuthState = useCallback(() => {
    clearAuthData();
    setUser(null);
    setPendingUser(null);
    setIsAuthenticated(false);
    setIsFaceRecognitionCompleted(false);
    localStorage.removeItem("faceRecognitionCompleted");
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
        const currentUser = savedUser ? (JSON.parse(savedUser) as User) : await getCurrentUser();

        if (!isMounted) return;

        setUser(currentUser);
        setIsAuthenticated(true);
        setIsFaceRecognitionCompleted(localStorage.getItem("faceRecognitionCompleted") === "true");
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

    initializeAuth();

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

      setUser(payload.user);
      setIsAuthenticated(true);
      setPendingUser(isStudent(payload.user) ? payload.user : null);

      if (!localStorage.getItem("faceRecognitionCompleted")) {
        localStorage.setItem("faceRecognitionCompleted", "false");
      }

      setIsFaceRecognitionCompleted(localStorage.getItem("faceRecognitionCompleted") === "true");

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
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      }

      return authStatus;
    } catch {
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  };

  const completeLogin = (userData?: User) => {
    const completedUser = userData ?? pendingUser ?? user;

    if (completedUser) {
      setUser(completedUser);
      localStorage.setItem("user", JSON.stringify(completedUser));
    }

    setPendingUser(null);
    setIsAuthenticated(true);
    setIsFaceRecognitionCompleted(true);
    localStorage.setItem("faceRecognitionCompleted", "true");
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
        pendingUser,
        isAuthenticated,
        isLoading,
        login,
        completeLogin,
        logout,
        checkAuthStatus,
        isFaceRecognitionCompleted,
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

function isStudent(user: User): boolean {
  return user.roles.some((role) => {
    const value = (role.code || role.name).toUpperCase();
    return value === "ROLE_STUDENT" || value === "STUDENT";
  });
}
