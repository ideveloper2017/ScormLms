import api from "@/lib/api";
import axios from "axios";

// ─── Error helper ──────────────────────────────────────────────────────────
export function extractApiError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return new Error(data?.message || data?.error || error.message || fallback);
  }
  return error instanceof Error ? error : new Error(fallback);
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface FacultyRecord {
  id: number;
  name: string;
  code?: string | null;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}
export interface FacultyCreateRequest {
  name: string;
  code?: string | null;
  active?: boolean;
}
export type FacultyUpdateRequest = Partial<FacultyCreateRequest>;

export interface DepartmentRecord {
  id: number;
  name: string;
  code?: string | null;
  active: boolean;
  facultyId?: number | null;
  facultyName?: string | null;
}
export interface DepartmentCreateRequest {
  name: string;
  code?: string | null;
  active?: boolean;
  facultyId?: number | null;
}
export type DepartmentUpdateRequest = Partial<DepartmentCreateRequest>;

export interface ProgramRecord {
  id: number;
  name: string;
  code?: string | null;
  degreeLevel?: string | null;
  active: boolean;
  departmentId?: number | null;
  departmentName?: string | null;
}
export interface ProgramCreateRequest {
  name: string;
  code?: string | null;
  degreeLevel?: string | null;
  active?: boolean;
  departmentId?: number | null;
}
export type ProgramUpdateRequest = Partial<ProgramCreateRequest>;

export interface GroupRecord {
  id: number;
  name: string;
  educationYear?: string | null;
  language?: string | null;
  active: boolean;
  programId?: number | null;
  programName?: string | null;
}
export interface GroupCreateRequest {
  name: string;
  educationYear?: string | null;
  language?: string | null;
  active?: boolean;
  programId?: number | null;
}
export type GroupUpdateRequest = Partial<GroupCreateRequest>;

export interface SubjectRecord {
  id: number;
  name: string;
  code?: string | null;
  credits?: number | null;
  active: boolean;
  programId?: number | null;
  programName?: string | null;
}
export interface SubjectCreateRequest {
  name: string;
  code?: string | null;
  credits?: number | null;
  active?: boolean;
  programId?: number | null;
}
export type SubjectUpdateRequest = Partial<SubjectCreateRequest>;

// ─── Faculties ─────────────────────────────────────────────────────────────
export async function listFaculties(): Promise<FacultyRecord[]> {
  try {
    return (await api.get<FacultyRecord[]>("/faculties")).data;
  } catch (e) { throw extractApiError(e, "Fakultetlarni yuklab bo'lmadi"); }
}
export async function createFaculty(req: FacultyCreateRequest): Promise<FacultyRecord> {
  try {
    return (await api.post<FacultyRecord>("/faculties", req)).data;
  } catch (e) { throw extractApiError(e, "Fakultet yaratib bo'lmadi"); }
}
export async function updateFaculty(id: number, req: FacultyUpdateRequest): Promise<FacultyRecord> {
  try {
    return (await api.put<FacultyRecord>(`/faculties/${id}`, req)).data;
  } catch (e) { throw extractApiError(e, "Fakultetni yangilab bo'lmadi"); }
}
export async function deleteFaculty(id: number): Promise<void> {
  try {
    await api.delete(`/faculties/${id}`);
  } catch (e) { throw extractApiError(e, "Fakultetni o'chirib bo'lmadi"); }
}

// ─── Departments ───────────────────────────────────────────────────────────
export async function listDepartments(facultyId?: number): Promise<DepartmentRecord[]> {
  try {
    return (await api.get<DepartmentRecord[]>("/departments", {
      params: facultyId ? { facultyId } : undefined,
    })).data;
  } catch (e) { throw extractApiError(e, "Kafedralarni yuklab bo'lmadi"); }
}
export async function createDepartment(req: DepartmentCreateRequest): Promise<DepartmentRecord> {
  try {
    return (await api.post<DepartmentRecord>("/departments", req)).data;
  } catch (e) { throw extractApiError(e, "Kafedra yaratib bo'lmadi"); }
}
export async function updateDepartment(id: number, req: DepartmentUpdateRequest): Promise<DepartmentRecord> {
  try {
    return (await api.put<DepartmentRecord>(`/departments/${id}`, req)).data;
  } catch (e) { throw extractApiError(e, "Kafedrani yangilab bo'lmadi"); }
}
export async function deleteDepartment(id: number): Promise<void> {
  try {
    await api.delete(`/departments/${id}`);
  } catch (e) { throw extractApiError(e, "Kafedrani o'chirib bo'lmadi"); }
}

// ─── Programs ──────────────────────────────────────────────────────────────
export async function listPrograms(departmentId?: number): Promise<ProgramRecord[]> {
  try {
    return (await api.get<ProgramRecord[]>("/programs", {
      params: departmentId ? { departmentId } : undefined,
    })).data;
  } catch (e) { throw extractApiError(e, "Yo'nalishlarni yuklab bo'lmadi"); }
}
export async function createProgram(req: ProgramCreateRequest): Promise<ProgramRecord> {
  try {
    return (await api.post<ProgramRecord>("/programs", req)).data;
  } catch (e) { throw extractApiError(e, "Yo'nalish yaratib bo'lmadi"); }
}
export async function updateProgram(id: number, req: ProgramUpdateRequest): Promise<ProgramRecord> {
  try {
    return (await api.put<ProgramRecord>(`/programs/${id}`, req)).data;
  } catch (e) { throw extractApiError(e, "Yo'nalishni yangilab bo'lmadi"); }
}
export async function deleteProgram(id: number): Promise<void> {
  try {
    await api.delete(`/programs/${id}`);
  } catch (e) { throw extractApiError(e, "Yo'nalishni o'chirib bo'lmadi"); }
}

// ─── Groups ────────────────────────────────────────────────────────────────
export async function listGroups(programId?: number): Promise<GroupRecord[]> {
  try {
    return (await api.get<GroupRecord[]>("/groups", {
      params: programId ? { programId } : undefined,
    })).data;
  } catch (e) { throw extractApiError(e, "Guruhlarni yuklab bo'lmadi"); }
}
export async function createGroup(req: GroupCreateRequest): Promise<GroupRecord> {
  try {
    return (await api.post<GroupRecord>("/groups", req)).data;
  } catch (e) { throw extractApiError(e, "Guruh yaratib bo'lmadi"); }
}
export async function updateGroup(id: number, req: GroupUpdateRequest): Promise<GroupRecord> {
  try {
    return (await api.put<GroupRecord>(`/groups/${id}`, req)).data;
  } catch (e) { throw extractApiError(e, "Guruhni yangilab bo'lmadi"); }
}
export async function deleteGroup(id: number): Promise<void> {
  try {
    await api.delete(`/groups/${id}`);
  } catch (e) { throw extractApiError(e, "Guruhni o'chirib bo'lmadi"); }
}

// ─── Subjects ──────────────────────────────────────────────────────────────
export async function listSubjects(programId?: number): Promise<SubjectRecord[]> {
  try {
    return (await api.get<SubjectRecord[]>("/subjects", {
      params: programId ? { programId } : undefined,
    })).data;
  } catch (e) { throw extractApiError(e, "Fanlarni yuklab bo'lmadi"); }
}
export async function createSubject(req: SubjectCreateRequest): Promise<SubjectRecord> {
  try {
    return (await api.post<SubjectRecord>("/subjects", req)).data;
  } catch (e) { throw extractApiError(e, "Fan yaratib bo'lmadi"); }
}
export async function updateSubject(id: number, req: SubjectUpdateRequest): Promise<SubjectRecord> {
  try {
    return (await api.put<SubjectRecord>(`/subjects/${id}`, req)).data;
  } catch (e) { throw extractApiError(e, "Fanni yangilab bo'lmadi"); }
}
export async function deleteSubject(id: number): Promise<void> {
  try {
    await api.delete(`/subjects/${id}`);
  } catch (e) { throw extractApiError(e, "Fanni o'chirib bo'lmadi"); }
}
