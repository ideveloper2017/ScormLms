import axios from "axios";
import api from "@/lib/api";
import { Permissions, Role, User } from "@/types/auth.types";

// Backend RBAC controllerlari (UserController, RoleController, PermissionController)
// javobni CommonApiResponse wrapper'siz, toza payload sifatida qaytaradi.

export function extractApiError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED" || !error.response) {
      return new Error("Serverga ulanib bo'lmadi. Internet aloqasini tekshiring.");
    }
    if (error.response.status === 401) {
      return new Error("Sessiya muddati tugagan. Qaytadan kiring.");
    }
    if (error.response.status === 403) {
      return new Error("Sizda bu amal uchun huquq yo'q.");
    }
    const data = error.response.data as { message?: string; error?: string } | undefined;
    if (data?.message) return new Error(data.message);
    if (data?.error) return new Error(data.error);
  }
  return error instanceof Error ? error : new Error(fallback);
}

// --- Users ---

export async function listUsers(): Promise<User[]> {
  try {
    const response = await api.get<User[]>("/users");
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Foydalanuvchilar ro'yxatini yuklab bo'lmadi");
  }
}

export async function registerUser(username: string, password: string): Promise<User> {
  try {
    const response = await api.post<User>("/users/register", { username, password });
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Foydalanuvchi yaratib bo'lmadi");
  }
}

export async function assignRoleToUser(username: string, roleCode: string): Promise<User> {
  try {
    const response = await api.post<User>(
      `/users/${encodeURIComponent(username)}/roles/${encodeURIComponent(roleCode)}`
    );
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Rol biriktirib bo'lmadi");
  }
}

export async function deleteUser(username: string): Promise<void> {
  try {
    await api.delete(`/users/${encodeURIComponent(username)}`);
  } catch (error) {
    throw extractApiError(error, "Foydalanuvchini o'chirib bo'lmadi");
  }
}

// --- Roles ---

export async function listRoles(): Promise<Role[]> {
  try {
    const response = await api.get<Role[]>("/roles");
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Rollar ro'yxatini yuklab bo'lmadi");
  }
}

export async function createRole(code: string, name: string): Promise<Role> {
  try {
    const response = await api.post<Role>("/roles", { code, name });
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Rol yaratib bo'lmadi");
  }
}

export async function addPermissionToRole(roleCode: string, permissionCode: string): Promise<Role> {
  try {
    const response = await api.post<Role>(
      `/roles/${encodeURIComponent(roleCode)}/permissions/${encodeURIComponent(permissionCode)}`
    );
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Rolga huquq qo'shib bo'lmadi");
  }
}

export async function deleteRole(code: string): Promise<void> {
  try {
    await api.delete(`/roles/${encodeURIComponent(code)}`);
  } catch (error) {
    throw extractApiError(error, "Rolni o'chirib bo'lmadi");
  }
}

// --- Audit Logs ---

export async function listAuditLogs(): Promise<any[]> {
  try {
    const response = await api.get<any[]>("/audit");
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Audit loglarni yuklab bo'lmadi");
  }
}

export async function listPermissions(): Promise<Permissions[]> {
  try {
    const response = await api.get<Permissions[]>("/permissions");
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Huquqlar ro'yxatini yuklab bo'lmadi");
  }
}

export async function createPermission(code: string, name: string): Promise<Permissions> {
  try {
    const response = await api.post<Permissions>("/permissions", { code, name });
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Huquq yaratib bo'lmadi");
  }
}

export async function deletePermission(code: string): Promise<void> {
  try {
    await api.delete(`/permissions/${encodeURIComponent(code)}`);
  } catch (error) {
    throw extractApiError(error, "Huquqni o'chirib bo'lmadi");
  }
}

// --- Authority helpers ---
// Backend JwtAuthFilter har so'rovda authorities'ni rol kodlari + permission kodlaridan yig'adi;
// frontendda ham xuddi shu qoidaga amal qilamiz.

export function getAuthorities(user: User | null): Set<string> {
  const authorities = new Set<string>();
  if (!user) return authorities;
  for (const role of user.roles ?? []) {
    if (role.code) authorities.add(role.code.toUpperCase());
    for (const permission of role.permissions ?? []) {
      if (permission.code) authorities.add(permission.code.toUpperCase());
    }
  }
  return authorities;
}

export function hasAuthority(user: User | null, authority: string): boolean {
  return getAuthorities(user).has(authority.toUpperCase());
}
