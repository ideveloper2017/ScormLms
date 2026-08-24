import api from "@/lib/api";
import { extractApiError } from "@/lib/academic-api";
import type { StudentAcademicResult } from "./academic-results-api";

export type ReReadingPlanStatus = "PLANNED" | "OPEN" | "CLOSED";
export type ReReadingApplicationStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface ReReadingPlan {
  id: number; title: string; applicationDeadline: string; description: string;
  status: ReReadingPlanStatus; createdAt?: string | null; updatedAt?: string | null;
}
export type SaveReReadingPlanRequest = Pick<ReReadingPlan, "title" | "applicationDeadline" | "description" | "status">;
export interface ReReadingStudent {
  id: number; fullName: string; studentNumber: string; group: string;
  academicYear?: string | null; semester?: number | null;
}
export interface ReReadingApplication {
  id: number; planId: number; planTitle: string; studentId: number; fullName: string;
  studentNumber: string; group: string; contractNumber: string; totalCredits: number;
  totalAmount: number; paidAmount: number; debtAmount: number; status: ReReadingApplicationStatus;
  submittedAt?: string | null; createdAt?: string | null;
}
export interface SaveReReadingApplicationRequest {
  planId: number; studentId: number; contractNumber?: string | null;
  totalCredits: number; totalAmount: number; paidAmount: number;
}
export interface ReReadingRecovery {
  applicationId: number; fullName: string; studentNumber: string; group: string;
  contractNumber: string; status: ReReadingApplicationStatus; results: StudentAcademicResult[];
}
export interface ReReadingTeacherReport {
  teacherId: number; teacherName: string; subjects: string[]; studentCount: number; totalCredits: number;
}
export interface ReReadingStudentReport {
  application: ReReadingApplication; assessedSubjects: number; passedSubjects: number;
  debtSubjects: number; averageScore?: number | null;
}

async function get<T>(path: string, fallback: string): Promise<T> {
  try { return (await api.get<T>(path)).data; } catch (error) { throw extractApiError(error, fallback); }
}
async function post<T, B>(path: string, body: B, fallback: string): Promise<T> {
  try { return (await api.post<T>(path, body)).data; } catch (error) { throw extractApiError(error, fallback); }
}
async function put<T, B>(path: string, body: B, fallback: string): Promise<T> {
  try { return (await api.put<T>(path, body)).data; } catch (error) { throw extractApiError(error, fallback); }
}
async function remove(path: string, fallback: string): Promise<void> {
  try { await api.delete(path); } catch (error) { throw extractApiError(error, fallback); }
}

export const listReReadingPlans = () => get<ReReadingPlan[]>("/re-reading/plans", "Qayta o'qish rejalarini yuklab bo'lmadi");
export const createReReadingPlan = (body: SaveReReadingPlanRequest) => post<ReReadingPlan, SaveReReadingPlanRequest>("/re-reading/plans", body, "Rejani yaratib bo'lmadi");
export const updateReReadingPlan = (id: number, body: SaveReReadingPlanRequest) => put<ReReadingPlan, SaveReReadingPlanRequest>(`/re-reading/plans/${id}`, body, "Rejani yangilab bo'lmadi");
export const deleteReReadingPlan = (id: number) => remove(`/re-reading/plans/${id}`, "Rejani o'chirib bo'lmadi");
export const listReReadingStudents = () => get<ReReadingStudent[]>("/re-reading/students", "Talabalarni yuklab bo'lmadi");
export const listReReadingApplications = () => get<ReReadingApplication[]>("/re-reading/applications", "Qayta o'qish arizalarini yuklab bo'lmadi");
export const createReReadingApplication = (body: SaveReReadingApplicationRequest) => post<ReReadingApplication, SaveReReadingApplicationRequest>("/re-reading/applications", body, "Arizani yaratib bo'lmadi");
export const updateReReadingApplication = (id: number, body: SaveReReadingApplicationRequest) => put<ReReadingApplication, SaveReReadingApplicationRequest>(`/re-reading/applications/${id}`, body, "Arizani yangilab bo'lmadi");
export const deleteReReadingApplication = (id: number) => remove(`/re-reading/applications/${id}`, "Arizani o'chirib bo'lmadi");
export const changeReReadingApplicationStatus = (id: number, status: ReReadingApplicationStatus) => post<ReReadingApplication, { status: ReReadingApplicationStatus }>(`/re-reading/applications/${id}/status`, { status }, "Ariza holatini o'zgartirib bo'lmadi");
export const listReReadingRecoveryResults = () => get<ReReadingRecovery[]>("/re-reading/recovery-results", "Qayta o'qish baholarini yuklab bo'lmadi");
export const listReReadingTeacherReport = () => get<ReReadingTeacherReport[]>("/re-reading/teacher-report", "O'qituvchi hisobotini yuklab bo'lmadi");
export const listReReadingStudentReport = () => get<ReReadingStudentReport[]>("/re-reading/student-report", "Talaba hisobotini yuklab bo'lmadi");
