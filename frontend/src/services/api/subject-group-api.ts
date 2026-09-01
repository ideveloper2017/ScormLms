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
  programLanguage: string;
  academicYear: string;
  curriculumSubjectId: number;
  subjectId?: number | null;
  subjectCode: string;
  subjectName: string;
  subjectCategoryId?: number | null;
  subjectCategoryName?: string | null;
  semester: number;
  credits: number;
  planItemType: "REQUIRED" | "ELECTIVE";
}

export interface AcademicSubjectGroupTeacher {
  teacherId: number;
  fullName: string;
  departmentName?: string | null;
  position?: string | null;
  active: boolean;
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
  teachingOptions: async () => (
    await api.get<AcademicSubjectGroup[]>("/subject-groups/teaching-options")
  ).data,
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
  teachers: async (id: number) => (
    await api.get<AcademicSubjectGroupTeacher[]>(`/subject-groups/${id}/teachers`)
  ).data,
  teacherCandidates: async (id: number) => (
    await api.get<AcademicSubjectGroupTeacher[]>(`/subject-groups/${id}/teacher-candidates`)
  ).data,
  assignTeacher: async (id: number, teacherId: number) => (
    await api.post<AcademicSubjectGroup>(`/subject-groups/${id}/teachers`, { teacherId })
  ).data,
  removeTeacher: async (id: number, teacherId: number) => (
    await api.delete<AcademicSubjectGroup>(`/subject-groups/${id}/teachers/${teacherId}`)
  ).data,
};
