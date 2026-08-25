import api from "@/lib/api";

interface User {
    username: string;
    email: string;
    role: 'admin' | 'operator' | 'viewer';
    fullName: string;
    avatar?: string;
}

interface AuthTokenResponse {
    username: String,
    roles: String[],
    permissions: String[],
    accessToken: String,
    refreshToken: String
}

interface AuthResponse {
    success: boolean;
    data: AuthTokenResponse;
    message: string;
}

export const auth={
    login: async (credentials: { username: string; password: string,otpCode:string }):Promise<AuthResponse> => {
          const response = await api.post<AuthResponse>('/auth/login', credentials)
          return response.data
    },
    me:async()=>{
        const response = await api.get<User>('/users/me');
        return response.data;
    },
    refresh: () =>
        api.post('/auth/refresh'),
    logout: () =>
        api.post('/auth/logout'),
}
