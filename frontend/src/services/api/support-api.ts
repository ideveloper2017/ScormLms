import api, { type ApiResponse } from '@/lib/api';

export type SupportStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_REQUESTER' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

export interface SupportSla {
  policyVersion: string;
  responseDueAt: string;
  resolutionDueAt: string;
  firstRespondedAt?: string | null;
  resolvedAt?: string | null;
  paused: boolean;
  pausedSeconds: number;
  responseBreached: boolean;
  resolutionBreached: boolean;
  responseRemainingSeconds?: number | null;
  resolutionRemainingSeconds?: number | null;
}

export interface SupportTicket {
  id: number;
  ticketCode: string;
  subject: string;
  category: 'TECHNICAL' | 'ACCESS' | 'CONTENT' | 'ASSESSMENT' | 'OTHER';
  impact: 'LIMITED' | 'MULTIPLE_USERS' | 'SERVICE_BLOCKED' | 'SECURITY';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: SupportStatus;
  requesterId: number;
  requesterName: string;
  assigneeId?: number | null;
  assigneeName?: string | null;
  courseId?: number | null;
  courseTitle?: string | null;
  sla: SupportSla;
  lastActivityAt: string;
  createdAt?: string | null;
}

export interface SupportEvent {
  id: number;
  sequenceNo: number;
  actorId: number;
  actorName: string;
  eventType: string;
  visibility: 'PUBLIC' | 'INTERNAL';
  body?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  occurredAt: string;
}

export interface SupportTicketDetail {
  ticket: SupportTicket;
  description: string;
  resolutionSummary?: string | null;
  events: SupportEvent[];
  canComment: boolean;
  canCancel: boolean;
  canReopen: boolean;
  canManage: boolean;
  allowedStatuses: SupportStatus[];
}

export interface SupportMetrics {
  totalActive: number;
  unassigned: number;
  responseBreached: number;
  resolutionBreached: number;
  dueWithinFourHours: number;
  resolved: number;
  averageFirstResponseMinutes?: number | null;
  averageResolutionMinutes?: number | null;
  byStatus: Record<string, number>;
  measuredAt: string;
}

export interface SupportAssignee { id: number; fullName: string; username: string; roleName?: string | null }

export interface CreateSupportTicket {
  subject: string;
  description: string;
  category: SupportTicket['category'];
  impact: SupportTicket['impact'];
  courseId?: number | null;
}

function dataOf<T>(response: { data: ApiResponse<T> }, fallback: string): T {
  if (!response.data.success || response.data.data === undefined || response.data.data === null) throw new Error(response.data.message ?? fallback);
  return response.data.data;
}

export const supportApi = {
  async mine(): Promise<SupportTicket[]> {
    return dataOf(await api.get<ApiResponse<SupportTicket[]>>('/support/tickets/my'), "Murojaatlarni yuklab bo'lmadi");
  },
  async queue(params?: { status?: string; assigneeId?: number; breachedOnly?: boolean }): Promise<SupportTicket[]> {
    return dataOf(await api.get<ApiResponse<SupportTicket[]>>('/support/queue', { params: params ?? {} }), "Support navbatini yuklab bo'lmadi");
  },
  async metrics(): Promise<SupportMetrics> {
    return dataOf(await api.get<ApiResponse<SupportMetrics>>('/support/queue/metrics'), "SLA metrikalarini yuklab bo'lmadi");
  },
  async assignees(): Promise<SupportAssignee[]> {
    return dataOf(await api.get<ApiResponse<SupportAssignee[]>>('/support/assignees'), "Mas'ullarni yuklab bo'lmadi");
  },
  async detail(id: number): Promise<SupportTicketDetail> {
    return dataOf(await api.get<ApiResponse<SupportTicketDetail>>(`/support/tickets/${id}`), "Murojaatni ochib bo'lmadi");
  },
  async create(request: CreateSupportTicket): Promise<SupportTicketDetail> {
    return dataOf(await api.post<ApiResponse<SupportTicketDetail>>('/support/tickets', request), "Murojaatni yaratib bo'lmadi");
  },
  async comment(id: number, body: string, internal = false): Promise<SupportTicketDetail> {
    return dataOf(await api.post<ApiResponse<SupportTicketDetail>>(`/support/tickets/${id}/comments`, { body, internal }), "Izohni yuborib bo'lmadi");
  },
  async assign(id: number, assigneeId: number): Promise<SupportTicketDetail> {
    return dataOf(await api.post<ApiResponse<SupportTicketDetail>>(`/support/tickets/${id}/assign`, { assigneeId }), "Mas'ulni biriktirib bo'lmadi");
  },
  async changeStatus(id: number, status: SupportStatus, resolutionSummary?: string): Promise<SupportTicketDetail> {
    return dataOf(await api.post<ApiResponse<SupportTicketDetail>>(`/support/tickets/${id}/status`, { status, resolutionSummary }), "Holatni yangilab bo'lmadi");
  },
  async cancel(id: number): Promise<SupportTicketDetail> {
    return dataOf(await api.post<ApiResponse<SupportTicketDetail>>(`/support/tickets/${id}/cancel`), "Murojaatni bekor qilib bo'lmadi");
  },
  async reopen(id: number): Promise<SupportTicketDetail> {
    return dataOf(await api.post<ApiResponse<SupportTicketDetail>>(`/support/tickets/${id}/reopen`), "Murojaatni qayta ochib bo'lmadi");
  },
};
