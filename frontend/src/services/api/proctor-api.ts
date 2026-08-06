import api, { type ApiResponse } from '@/lib/api';

export interface ProctorStats {
  activeExams: number;
  totalStudents: number;
  violations: number;
  flaggedStudents: number;
  completedToday: number;
  avgScore: number;
}

export interface ActiveExam {
  id: string;
  title: string;
  course: string;
  startTime: string;
  duration: number;
  totalStudents: number;
  activeStudents: number;
  violations: number;
  status: 'active' | 'completed';
}

export interface ProctorSessionSummary {
  attemptId: string;
  quizId: string;
  examTitle: string;
  course: string;
  studentName: string;
  startedAt: string;
  expiresAt: string;
  status: 'active' | 'completed' | 'timed_out';
  riskEvents: number;
  lastEventAt?: string;
  lastHeartbeatAt?: string;
}

export interface ViolationRecord {
  id: string;
  attemptId: string;
  studentName: string;
  examTitle: string;
  type: string;
  timestamp: string;
  severity: 'medium' | 'high' | 'critical';
  source: 'client' | 'server';
}

export interface ProctorEvidenceEvent {
  id: string;
  type: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  source: 'client' | 'server';
  occurredAt: string;
}

export interface ProctorAttemptEvidence {
  attemptId: string;
  quizId: string;
  examTitle: string;
  course: string;
  studentName: string;
  attemptStatus: string;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
  score: number;
  totalPoints: number;
  identitySimilarity?: number;
  movementDelta?: number;
  challengeDirection: 'left' | 'right';
  verifiedAt?: string;
  consumedAt?: string;
  centerFrameHash?: string;
  challengeFrameHash?: string;
  events: ProctorEvidenceEvent[];
}

export interface ProctoringAppealEvent {
  id: string;
  type: string;
  severity: 'medium' | 'high' | 'critical';
  occurredAt: string;
}

export interface ProctoringAppeal {
  id: string;
  attemptId: string;
  quizId: string;
  examTitle: string;
  course: string;
  studentName: string;
  reason: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'partial' | 'rejected';
  disputedEvents: ProctoringAppealEvent[];
  reviewedAt?: string;
  reviewedBy?: string;
  decision?: string;
}

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data == null) throw new Error(response.message || fallback);
  return response.data;
}

export const proctorApi = {
  getStats: async (): Promise<ProctorStats> =>
    unwrap((await api.get<ApiResponse<ProctorStats>>('/proctors/me/stats')).data, 'Statistika yuklanmadi'),

  getActiveExams: async (): Promise<ActiveExam[]> =>
    unwrap((await api.get<ApiResponse<ActiveExam[]>>('/proctors/me/active-exams')).data, 'Imtihonlar yuklanmadi'),

  getSessions: async (): Promise<ProctorSessionSummary[]> =>
    unwrap((await api.get<ApiResponse<ProctorSessionSummary[]>>('/proctors/me/sessions')).data, 'Sessiyalar yuklanmadi'),

  getViolations: async (): Promise<ViolationRecord[]> =>
    unwrap((await api.get<ApiResponse<ViolationRecord[]>>('/proctors/me/violations')).data, 'Risk hodisalari yuklanmadi'),

  getEvidence: async (attemptId: string): Promise<ProctorAttemptEvidence> =>
    unwrap((await api.get<ApiResponse<ProctorAttemptEvidence>>(`/proctors/me/sessions/${attemptId}`)).data, 'Dalil yuklanmadi'),

  getAppeals: async (): Promise<ProctoringAppeal[]> =>
    unwrap((await api.get<ApiResponse<ProctoringAppeal[]>>('/proctors/me/appeals')).data, 'Apellyatsiyalar yuklanmadi'),

  reviewAppeal: async (
    appealId: string,
    status: 'APPROVED' | 'PARTIAL' | 'REJECTED',
    decision: string,
  ): Promise<ProctoringAppeal> => unwrap(
    (await api.post<ApiResponse<ProctoringAppeal>>(`/proctors/me/appeals/${appealId}/review`, { status, decision })).data,
    'Apellyatsiya qarori saqlanmadi',
  ),
};
