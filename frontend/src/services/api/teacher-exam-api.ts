import api from '@/lib/api';

export type ExamSessionStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED';
export type ExamAttendanceStatus = 'EXPECTED' | 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';

export interface TeacherExamSession {
  id: string; courseId: string; courseTitle: string; title: string; description?: string;
  examDate: string; examTime: string; location: string; examType: 'WRITTEN' | 'ORAL' | 'PRACTICAL' | 'HYBRID';
  durationMinutes: number; examinerName: string; status: ExamSessionStatus; maxCapacity?: number;
  registeredCount: number; presentCount: number; absentCount: number; publishedAt?: string; heldAt?: string;
}

export interface AttendanceRecord {
  id: string; enrollmentId: string; studentId: string; studentName: string; studentEmail: string;
  status: ExamAttendanceStatus; arrivalTime?: string; departureTime?: string; specialConditions?: string;
  proctorNotes?: string; verifiedBy?: string; verificationTime?: string;
  onsiteAttendanceRequired: boolean;
}

export interface AttendanceSheet {
  examSessionId: string; examTitle: string; examDate: string; examTime: string; location: string;
  totalEnrolled: number; attendanceRecords: AttendanceRecord[];
}

export interface TeacherExamResult {
  id: string; examSessionId: string; enrollmentId: string; studentName: string;
  score: number; totalScore: number; percentage: number; passed: boolean; grade?: string;
}

export interface ExamAppeal {
  id: string; examResultId: string; studentName: string; appealDate: string; reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PARTIAL'; decision?: string; newScore?: number;
}

export interface CreateExamSessionPayload {
  courseId: number; title: string; description?: string; examDate: string; examTime: string; location: string;
  maxCapacity?: number; examType: TeacherExamSession['examType']; durationMinutes: number;
}

export const teacherExamApi = {
  list: async () => (await api.get<TeacherExamSession[]>('/teachers/me/exams')).data,
  create: async (payload: CreateExamSessionPayload) => (await api.post<TeacherExamSession>('/teachers/me/exams', payload)).data,
  publish: async (id: string) => (await api.post<TeacherExamSession>(`/teachers/me/exams/${id}/publish`)).data,
  start: async (id: string) => (await api.post<TeacherExamSession>(`/teachers/me/exams/${id}/start`)).data,
  complete: async (id: string) => (await api.post<TeacherExamSession>(`/teachers/me/exams/${id}/complete`)).data,
  remove: async (id: string) => { await api.delete(`/teachers/me/exams/${id}`); },
  attendance: async (id: string) => (await api.get<AttendanceSheet>(`/teachers/me/exams/${id}/attendance`)).data,
  recordAttendance: async (id: string, enrollmentId: string, status: ExamAttendanceStatus) =>
    (await api.put<AttendanceRecord>(`/teachers/me/exams/${id}/attendance/${enrollmentId}`, { attendanceStatus: status })).data,
  results: async (id: string) => (await api.get<TeacherExamResult[]>(`/teachers/me/exams/${id}/results`)).data,
  recordResult: async (id: string, enrollmentId: string, score: number) =>
    (await api.put<TeacherExamResult>(`/teachers/me/exams/${id}/results/${enrollmentId}`, { enrollmentId: Number(enrollmentId), score, totalScore: 100 })).data,
  appeals: async (id: string) => (await api.get<ExamAppeal[]>(`/teachers/me/exams/${id}/appeals`)).data,
  reviewAppeal: async (appealId: string, status: 'APPROVED' | 'PARTIAL' | 'REJECTED', decision: string, newScore?: number) =>
    (await api.post<ExamAppeal>(`/teachers/me/exams/appeals/${appealId}/review`, { status, decision, newScore })).data,
};
