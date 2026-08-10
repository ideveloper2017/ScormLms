import api from "@/lib/api";

export interface AcademicYearPeriod {
  id: number;
  code: string;
  startsOn: string;
  endsOn: string;
  active: boolean;
  current: boolean;
}

export interface AcademicSemesterDefinition {
  id: number;
  semesterNumber: number;
  nameUz: string;
  courseNumber: number;
  active: boolean;
}

export const academicPeriodApi = {
  listYears: async (includeInactive = false) => (
    await api.get<AcademicYearPeriod[]>("/academic-periods/years", { params: { includeInactive } })
  ).data,
  listSemesters: async (includeInactive = false) => (
    await api.get<AcademicSemesterDefinition[]>("/academic-periods/semesters", { params: { includeInactive } })
  ).data,
  createYear: async (input: { code: string; active: boolean; current: boolean }) => (
    await api.post<AcademicYearPeriod>("/academic-periods/years", input)
  ).data,
  updateYearState: async (id: number, input: { active: boolean; current: boolean }) => (
    await api.put<AcademicYearPeriod>(`/academic-periods/years/${id}/state`, input)
  ).data,
  updateSemester: async (id: number, input: { nameUz: string; active: boolean }) => (
    await api.put<AcademicSemesterDefinition>(`/academic-periods/semesters/${id}`, input)
  ).data,
};
