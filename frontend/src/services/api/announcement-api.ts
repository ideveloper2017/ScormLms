import api, { type ApiResponse } from '@/lib/api';

export type AnnouncementAudience = 'COURSE' | 'INSTITUTION';
export type AnnouncementChannel = 'IN_APP' | 'EMAIL' | 'PUSH';
export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface AnnouncementRequest {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  courseId?: number | null;
  category: 'INFORMATION' | 'DEADLINE' | 'EVENT' | 'WARNING';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  channels: AnnouncementChannel[];
  actionUrl?: string | null;
}

export interface AnnouncementDeliveryStat {
  channel: AnnouncementChannel;
  pending: number;
  delivered: number;
  read: number;
  failed: number;
  skipped: number;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  courseId?: number | null;
  courseTitle?: string | null;
  category: AnnouncementRequest['category'];
  priority: AnnouncementRequest['priority'];
  status: AnnouncementStatus;
  channels: AnnouncementChannel[];
  actionUrl?: string | null;
  authorId: number;
  authorName: string;
  publishedAt?: string | null;
  archivedAt?: string | null;
  createdAt?: string | null;
  recipientCount: number;
  readCount: number;
  deliveryStats: AnnouncementDeliveryStat[];
  canEdit: boolean;
  canPublish: boolean;
  canArchive: boolean;
  canRetry: boolean;
}

export interface AnnouncementInboxItem {
  id: number;
  deliveryId: number;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  courseId?: number | null;
  courseTitle?: string | null;
  category: AnnouncementRequest['category'];
  priority: AnnouncementRequest['priority'];
  actionUrl?: string | null;
  authorName: string;
  publishedAt: string;
  read: boolean;
  readAt?: string | null;
}

export interface AnnouncementOptions {
  canPublishInstitution: boolean;
  courses: Array<{ id: number; title: string; status?: string | null }>;
  supportedChannels: AnnouncementChannel[];
}

export interface AnnouncementDelivery {
  id: number;
  recipientId: number;
  recipientName: string;
  channel: AnnouncementChannel;
  status: 'PENDING' | 'DELIVERED' | 'READ' | 'FAILED' | 'SKIPPED';
  attemptCount: number;
  destinationMasked?: string | null;
  providerReference?: string | null;
  lastAttemptAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  lastError?: string | null;
}

export interface AnnouncementDeliveryReport {
  announcementId: number;
  stats: AnnouncementDeliveryStat[];
  deliveries: AnnouncementDelivery[];
}

function dataOf<T>(response: { data: ApiResponse<T> }, fallback: string): T {
  if (!response.data.success || response.data.data === undefined || response.data.data === null) {
    throw new Error(response.data.message ?? fallback);
  }
  return response.data.data;
}

export const announcementApi = {
  async inbox(): Promise<AnnouncementInboxItem[]> {
    return dataOf(await api.get<ApiResponse<AnnouncementInboxItem[]>>('/announcements/inbox'), "E'lonlarni yuklab bo'lmadi");
  },
  async markRead(id: number): Promise<AnnouncementInboxItem> {
    return dataOf(await api.post<ApiResponse<AnnouncementInboxItem>>(`/announcements/${id}/read`), "O'qilganlikni saqlab bo'lmadi");
  },
  async options(): Promise<AnnouncementOptions> {
    return dataOf(await api.get<ApiResponse<AnnouncementOptions>>('/announcements/manage/options'), "E'lon sozlamalarini yuklab bo'lmadi");
  },
  async manage(): Promise<Announcement[]> {
    return dataOf(await api.get<ApiResponse<Announcement[]>>('/announcements/manage'), "E'lonlarni yuklab bo'lmadi");
  },
  async create(request: AnnouncementRequest): Promise<Announcement> {
    return dataOf(await api.post<ApiResponse<Announcement>>('/announcements', request), "E'lonni yaratib bo'lmadi");
  },
  async update(id: number, request: AnnouncementRequest): Promise<Announcement> {
    return dataOf(await api.put<ApiResponse<Announcement>>(`/announcements/${id}`, request), "E'lonni yangilab bo'lmadi");
  },
  async publish(id: number): Promise<Announcement> {
    return dataOf(await api.post<ApiResponse<Announcement>>(`/announcements/${id}/publish`), "E'lonni chop etib bo'lmadi");
  },
  async archive(id: number): Promise<Announcement> {
    return dataOf(await api.post<ApiResponse<Announcement>>(`/announcements/${id}/archive`), "E'lonni arxivlab bo'lmadi");
  },
  async deliveries(id: number): Promise<AnnouncementDeliveryReport> {
    return dataOf(await api.get<ApiResponse<AnnouncementDeliveryReport>>(`/announcements/${id}/deliveries`), "Yetkazilish hisobotini yuklab bo'lmadi");
  },
  async retry(id: number): Promise<{ attempted: number; delivered: number; failed: number; skipped: number }> {
    return dataOf(await api.post<ApiResponse<{ attempted: number; delivered: number; failed: number; skipped: number }>>(`/announcements/${id}/deliveries/retry`), "Yetkazishni qayta urinib bo'lmadi");
  },
};
