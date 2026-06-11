export interface User {
  id?: number | null;
  username: string;
  email?: string | null;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  photo?: string;
  enabled?: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  roles: Role[];
  createdAt?: string;
  updatedAt?: string;
}


export interface Role {
    id?: number | null;
    code?: string;
    name: string;
    permissions?: Permissions[];
}

export interface Permissions {
    id?: number | null;
    code?: string;
    name: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthPayload {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface AuthResponse {
    success: boolean;
    data?: AuthPayload;
    message?: string;
    error?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
}
