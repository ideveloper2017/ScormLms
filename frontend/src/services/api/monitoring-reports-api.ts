import api from "@/lib/api";
import { extractApiError } from "@/lib/academic-api";

export interface StudentLoginMonitorRow {
  studentId: number; fullName: string; studentNumber: string; group: string;
  lastLoginAt?: string | null; inactiveDays?: number | null;
}
export interface ElectiveChoiceExceptionRow {
  studentId: number; fullName: string; curriculum: string; group: string; subject: string;
  academicYear: string; semester: number; status: string;
}
export interface LearningParticipationRow {
  eventId: number; studentId: number; fullName: string; group: string; program: string;
  lesson: string; eventType: string; loginDate: string; durationSeconds: number;
}
export interface StudentIpReportRow {
  studentId: number; fullName: string; studentNumber: string; group: string; username: string;
  ipAddresses: string[]; loginCount: number; lastSeenAt: string;
}
export interface LessonCommentReportRow {
  postId: number; academicYear: string; program: string; semester?: number | null; course: string;
  topic: string; author: string; comment: string; createdAt?: string | null; hidden: boolean;
}

async function load<T>(path: string, fallback: string, params?: Record<string, unknown>): Promise<T[]> {
  try { return (await api.get<T[]>(path, params ? { params } : undefined)).data; }
  catch (error) { throw extractApiError(error, fallback); }
}

export const listInactiveStudents = (inactiveDays = 7) => load<StudentLoginMonitorRow>("/monitoring/inactive-students", "Faol bo'lmagan talabalarni yuklab bo'lmadi", { inactiveDays });
export const listElectiveExceptions = () => load<ElectiveChoiceExceptionRow>("/monitoring/elective-exceptions", "Tanlov fani istisnolarini yuklab bo'lmadi");
export const listLearningParticipation = () => load<LearningParticipationRow>("/monitoring/learning-participation", "Fanlardagi ishtirokni yuklab bo'lmadi");
export const listStudentIps = () => load<StudentIpReportRow>("/monitoring/student-ips", "IP hisobotini yuklab bo'lmadi");
export const listLessonComments = () => load<LessonCommentReportRow>("/monitoring/lesson-comments", "Izohlarni yuklab bo'lmadi");
