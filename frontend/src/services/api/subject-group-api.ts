import api from "@/lib/api";

export interface AcademicSubjectGroup {
  id: number;
  code: string;
  name: string;
  capacity: number;
  active: boolean;
  memberCount: number;
  curriculumId: number;
  curriculumVersionCode: string;
  programId: number;
  programName: string;
  academicYear: string;
  curriculumSubjectId: number;
  subjectId?: number | null;
  subjectCode: string;
  subjectName: string;
  semester: number;
}

export interface AcademicSubjectGroupStudent {
  studentId: number;
  studentNumber: string;
  fullName: string;
  status: string;
  semesterNumber?: number | null;
  primaryGroupId?: number | null;
}

export interface AcademicSubjectGroupCandidatePage {
  items: AcademicSubjectGroupStudent[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CreateAcademicSubjectGroupInput {
  curriculumSubjectId: number;
  code: string;
  name: string;
  capacity: number;
  active: boolean;
}

export type UpdateAcademicSubjectGroupInput = Omit<CreateAcademicSubjectGroupInput, "curriculumSubjectId">;

export const subjectGroupApi = {
  list: async (params: {
    curriculumId?: number;
    academicYear?: string;
    semester?: number;
    subjectId?: number;
    active?: boolean;
  } = {}) => (await api.get<AcademicSubjectGroup[]>("/subject-groups", { params })).data,
  get: async (id: number) => (await api.get<AcademicSubjectGroup>(`/subject-groups/${id}`)).data,
  create: async (input: CreateAcademicSubjectGroupInput) => (
    await api.post<AcademicSubjectGroup>("/subject-groups", input)
  ).data,
  update: async (id: number, input: UpdateAcademicSubjectGroupInput) => (
    await api.put<AcademicSubjectGroup>(`/subject-groups/${id}`, input)
  ).data,
  members: async (id: number) => (
    await api.get<AcademicSubjectGroupStudent[]>(`/subject-groups/${id}/students`)
  ).data,
  candidates: async (id: number, params: { search?: string; page?: number; size?: number } = {}) => (
    await api.get<AcademicSubjectGroupCandidatePage>(`/subject-groups/${id}/candidates`, { params })
  ).data,
  assign: async (id: number, studentIds: number[]) => (
    await api.post<AcademicSubjectGroup>(`/subject-groups/${id}/students`, { studentIds })
  ).data,
  removeStudent: async (id: number, studentId: number) => (
    await api.delete<AcademicSubjectGroup>(`/subject-groups/${id}/students/${studentId}`)
  ).data,
};
