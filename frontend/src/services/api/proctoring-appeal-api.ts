import api, { type ApiResponse } from '@/lib/api';
import type { ProctoringAppeal, ProctoringAppealEvent } from './proctor-api';

export interface ProctoringAppealContext {
  attemptId: string;
  quizId: string;
  eligible: boolean;
  deadline: string;
  riskEvents: ProctoringAppealEvent[];
  appeal?: ProctoringAppeal;
}

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data == null) throw new Error(response.message || fallback);
  return response.data;
}

const endpoint = (quizId: string, attemptId: string) =>
  `/tests/${quizId}/attempts/${attemptId}/proctoring/appeal`;

export const proctoringAppealApi = {
  getContext: async (quizId: string, attemptId: string): Promise<ProctoringAppealContext> =>
    unwrap((await api.get<ApiResponse<ProctoringAppealContext>>(endpoint(quizId, attemptId))).data, 'Apellyatsiya ma\'lumoti yuklanmadi'),

  create: async (quizId: string, attemptId: string, reason: string, eventIds: string[]): Promise<ProctoringAppeal> =>
    unwrap((await api.post<ApiResponse<ProctoringAppeal>>(endpoint(quizId, attemptId), {
      reason,
      eventIds: eventIds.map(Number),
    })).data, 'Apellyatsiya yuborilmadi'),
};
