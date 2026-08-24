import api from "@/lib/api";
import { extractApiError } from "@/lib/academic-api";

export interface SubjectRef {
  id: number;
  name: string;
}

export interface TeacherRecord {
  id: number;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  academicDegree?: string | null;
  academicRank?: string | null;
  position?: string | null;
  active: boolean;
  departmentId?: number | null;
  departmentName?: string | null;
  userId?: number | null;
  username?: string | null;
  subjects: SubjectRef[];
}

type TeacherApiRecord = Omit<TeacherRecord, "subjects"> & {
  subjects?: SubjectRef[] | null;
};

function normalizeTeacher(teacher: TeacherApiRecord): TeacherRecord {
  return {
    ...teacher,
    subjects: Array.isArray(teacher.subjects) ? teacher.subjects : [],
  };
}

export interface TeacherCreateRequest {
  fullName: string;
  phone?: string | null;
  email?: string | null;
  academicDegree?: string | null;
  academicRank?: string | null;
  position?: string | null;
  active?: boolean;
  departmentId?: number | null;
  subjectIds?: number[];
  // Ixtiyoriy login akkaunti
  username?: string | null;
  password?: string | null;
}

export interface TeacherUpdateRequest {
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  academicDegree?: string | null;
  academicRank?: string | null;
  position?: string | null;
  active?: boolean;
  departmentId?: number | null;
  subjectIds?: number[];
}

export async function listTeachers(departmentId?: number): Promise<TeacherRecord[]> {
  try {
    const response = await api.get<TeacherApiRecord[]>("/teachers", {
      params: departmentId ? { departmentId } : undefined,
    });
    return response.data.map(normalizeTeacher);
  } catch (e) { throw extractApiError(e, "O'qituvchilarni yuklab bo'lmadi"); }
}
export async function createTeacher(req: TeacherCreateRequest): Promise<TeacherRecord> {
  try {
    return normalizeTeacher((await api.post<TeacherApiRecord>("/teachers", req)).data);
  } catch (e) { throw extractApiError(e, "O'qituvchi yaratib bo'lmadi"); }
}
export async function updateTeacher(id: number, req: TeacherUpdateRequest): Promise<TeacherRecord> {
  try {
    return normalizeTeacher((await api.put<TeacherApiRecord>(`/teachers/${id}`, req)).data);
  } catch (e) { throw extractApiError(e, "O'qituvchini yangilab bo'lmadi"); }
}
export async function deleteTeacher(id: number): Promise<void> {
  try {
    await api.delete(`/teachers/${id}`);
  } catch (e) { throw extractApiError(e, "O'qituvchini o'chirib bo'lmadi"); }
}
