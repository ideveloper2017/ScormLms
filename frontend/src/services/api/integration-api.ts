import api, { type ApiResponse } from '@/lib/api';

export type IntegrationEventStatus = 'PENDING' | 'PROCESSING' | 'FAILED' | 'SUCCEEDED' | 'DEAD_LETTER';

export interface IntegrationMetrics {
  total: number;
  pending: number;
  processing: number;
  failed: number;
  succeeded: number;
  deadLetter: number;
  dueNow: number;
  successRate: number;
  lastCompletedAt?: string | null;
  workerEnabled: boolean;
  canManage: boolean;
}

export interface IntegrationEvent {
  id: number;
  eventKey: string;
  connector: string;
  eventType: string;
  aggregateType: string;
  aggregateId: number;
  payloadVersion: number;
  priority: number;
  status: IntegrationEventStatus;
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt: string;
  lastAttemptAt?: string | null;
  completedAt?: string | null;
  providerReference?: string | null;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  createdAt?: string | null;
  canRetry: boolean;
}

export interface IntegrationAttempt {
  id: number;
  sequence: number;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  outcome: 'SUCCESS' | 'RETRY_SCHEDULED' | 'DEAD_LETTER';
  errorCode?: string | null;
  errorMessage?: string | null;
  providerReference?: string | null;
}

export interface IntegrationEventDetail {
  event: IntegrationEvent;
  attempts: IntegrationAttempt[];
}

export interface IntegrationProcessResult {
  selected: number;
  succeeded: number;
  retryScheduled: number;
  deadLetter: number;
  skipped: number;
}

function dataOf<T>(response: { data: ApiResponse<T> }, fallback: string): T {
  if (!response.data.success || response.data.data === undefined || response.data.data === null) {
    throw new Error(response.data.message ?? fallback);
  }
  return response.data.data;
}

export const integrationApi = {
  async metrics(): Promise<IntegrationMetrics> {
    return dataOf(await api.get<ApiResponse<IntegrationMetrics>>('/integrations/metrics'), "Integratsiya metrikalarini yuklab bo'lmadi");
  },
  async events(params?: { status?: IntegrationEventStatus; connector?: string; errorOnly?: boolean; limit?: number }): Promise<IntegrationEvent[]> {
    return dataOf(await api.get<ApiResponse<IntegrationEvent[]>>('/integrations/events', { params: params ?? {} }), "Integratsiya eventlarini yuklab bo'lmadi");
  },
  async detail(id: number): Promise<IntegrationEventDetail> {
    return dataOf(await api.get<ApiResponse<IntegrationEventDetail>>(`/integrations/events/${id}`), "Integratsiya auditini yuklab bo'lmadi");
  },
  async processDue(limit = 100): Promise<IntegrationProcessResult> {
    return dataOf(await api.post<ApiResponse<IntegrationProcessResult>>('/integrations/process-due', undefined, { params: { limit } }), "Outbox navbatini ishlab bo'lmadi");
  },
  async retry(id: number): Promise<IntegrationEvent> {
    return dataOf(await api.post<ApiResponse<IntegrationEvent>>(`/integrations/events/${id}/retry`), "Eventni qayta navbatga qo'yib bo'lmadi");
  },
};
