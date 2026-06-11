// Token management utilities

import {User} from "@/types/auth.types.ts";

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('token');
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

export const setRefreshToken = (token: string): void => {
  localStorage.setItem('refreshToken', token);
};

export const removeRefreshToken = (): void => {
  localStorage.removeItem('refreshToken');
};
export const setAuthUser=(user:User)=>{
    localStorage.setItem('user', JSON.stringify(user));
}

export const clearAuthData = (): void => {
  removeToken();
  removeRefreshToken();
  localStorage.removeItem('user');
};
