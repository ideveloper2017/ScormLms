import axios from "axios";
import api from "@/lib/api";
import { Permissions, Role, User, UserStatus } from "@/types/auth.types";

// --- UserRecord: backend UserDto shape ---
export interface UserRecord {
  id: number;
  fullName: string | null;
  username: string;
  email: string | null;
  phone: string | null;
  jshshir: string | null;
  faculty: string | null;
  direction: string | null;
  groupName: string | null;
  role: Role | null;
  status: UserStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UserCreateRequest {
  fullName?: string;
  username: string;
  email?: string;
  phone?: string;
  jshshir?: string;
  faculty?: string;
  direction?: string;
  groupName?: string;
  password: string;
  roleCode: string;
}

export interface UserUpdateRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  jshshir?: string;
  faculty?: string;
  direction?: string;
  groupName?: string;
  roleCode?: string;
  status?: UserStatus;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  username: string | null;
  action: string;
  details: string | null;
  method: string | null;
  path: string | null;
  status: number | null;
  ip: string | null;
}

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

export async function listUsers(): Promise<UserRecord[]> {
  try {
    const response = await api.get<UserRecord[]>("/users");
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Foydalanuvchilar ro'yxatini yuklab bo'lmadi");
  }
}

export async function createUser(request: UserCreateRequest): Promise<UserRecord> {
  try {
    const response = await api.post<UserRecord>("/users", request);
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Foydalanuvchi yaratib bo'lmadi");
  }
}

export async function updateUser(id: number, request: UserUpdateRequest): Promise<UserRecord> {
  try {
    const response = await api.put<UserRecord>(`/users/${id}`, request);
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Foydalanuvchini yangilab bo'lmadi");
  }
}

export async function changeUserStatus(id: number, status: UserStatus): Promise<UserRecord> {
  try {
    const response = await api.patch<UserRecord>(`/users/${id}/status`, null, {
      params: { status },
    });
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Statusni o'zgartirib bo'lmadi");
  }
}

export async function assignRoleToUser(username: string, roleName: string): Promise<UserRecord> {
  try {
    const response = await api.post<UserRecord>(
      `/users/${encodeURIComponent(username)}/roles/${encodeURIComponent(roleName)}`
    );
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Rol biriktirib bo'lmadi");
  }
}

export async function resetUserPassword(id: number, newPassword: string): Promise<UserRecord> {
  try {
    const response = await api.patch<UserRecord>(`/users/${id}/password`, { newPassword });
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Parolni tiklash amalga oshmadi");
  }
}

export async function importUsers(users: UserCreateRequest[]): Promise<UserRecord[]> {
  try {
    const response = await api.post<UserRecord[]>("/users/import", { users });
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Import amalga oshmadi");
  }
}

export async function deleteUser(id: number): Promise<void> {
  try {
    await api.delete(`/users/${id}`);
  } catch (error) {
    throw extractApiError(error, "Foydalanuvchini o'chirib bo'lmadi");
  }
}

// Legacy compat — old code may call registerUser
export async function registerUser(username: string, password: string): Promise<UserRecord> {
  return createUser({ username, password, roleCode: "student" });
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

export async function createRole(name: string): Promise<Role> {
  try {
    const response = await api.post<Role>("/roles", { name });
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Rol yaratib bo'lmadi");
  }
}

export async function deleteRole(name: string): Promise<void> {
  try {
    await api.delete(`/roles/${encodeURIComponent(name)}`);
  } catch (error) {
    throw extractApiError(error, "Rolni o'chirib bo'lmadi");
  }
}

// --- Audit Logs ---

export async function listAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const response = await api.get<AuditLogEntry[]>("/audit");
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Audit loglarni yuklab bo'lmadi");
  }
}

export async function getUserAuditLogs(username: string): Promise<AuditLogEntry[]> {
  try {
    const response = await api.get<AuditLogEntry[]>(`/audit/user/${encodeURIComponent(username)}`);
    return response.data;
  } catch (error) {
    throw extractApiError(error, "Foydalanuvchi loglarini yuklab bo'lmadi");
  }
}

// --- Permissions (stubs — permissions are now hardcoded in backend) ---

export async function listPermissions(): Promise<Permissions[]> { return []; }
export async function createPermission(_c: string, _n: string): Promise<Permissions> { throw new Error("Not supported"); }
export async function deletePermission(_c: string): Promise<void> { throw new Error("Not supported"); }
export async function addPermissionToRole(_r: string, _p: string): Promise<Role> { throw new Error("Not supported"); }

// --- Authority helpers ---

/**
 * Builds a flat set of authority strings for the given user.
 * Checks three sources (in priority order):
 *   1. user.permissions[] — sent by backend UserDto (most reliable)
 *   2. user.role.name     — derives ROLE_<NAME>
 *   3. user.roles[]       — for backward compat with old multi-role shape
 */
export function getAuthorities(user: User | null): Set<string> {
  const auth = new Set<string>();
  if (!user) return auth;

  // Source 1: flat permissions list from backend (KEY FIX)
  for (const perm of user.permissions ?? []) {
    auth.add(perm.toUpperCase());
  }

  // Source 2: single role (new backend shape)
  if (user.role?.name) {
    auth.add(`ROLE_${user.role.name.toUpperCase()}`);
    auth.add(user.role.name.toUpperCase());
  }

  // Source 3: roles array (normalized / legacy)
  for (const role of user.roles ?? []) {
    if (role.name) {
      auth.add(`ROLE_${role.name.toUpperCase()}`);
      auth.add(role.name.toUpperCase());
    }
    if (role.code) auth.add(role.code.toUpperCase());
    for (const p of role.permissions ?? []) {
      if (p.code) auth.add(p.code.toUpperCase());
    }
  }

  return auth;
}

export function hasAuthority(user: User | null, authority: string): boolean {
  return getAuthorities(user).has(authority.toUpperCase());
}
