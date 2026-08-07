import api, { type ApiResponse } from '@/lib/api';

export type ForumTopicStatus = 'OPEN' | 'LOCKED' | 'ARCHIVED';

export interface ForumTopic {
  id: number;
  courseId: number;
  title: string;
  body: string;
  status: ForumTopicStatus;
  pinned: boolean;
  replyCount: number;
  authorId: number;
  authorName: string;
  createdAt?: string | null;
  lastActivityAt: string;
  canModerate: boolean;
}

export interface ForumPost {
  id: number;
  topicId: number;
  authorId: number;
  authorName: string;
  replyToId?: number | null;
  replyToAuthorName?: string | null;
  body?: string | null;
  revisionNumber: number;
  editedAt?: string | null;
  hidden: boolean;
  hiddenAt?: string | null;
  hiddenReason?: string | null;
  createdAt?: string | null;
  canEdit: boolean;
  canHide: boolean;
}

export interface ForumTopicPage {
  items: ForumTopic[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  canCreateTopic: boolean;
  canModerate: boolean;
}

export interface ForumPostPage {
  topic: ForumTopic;
  posts: ForumPost[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  canReply: boolean;
}

export interface ForumPostRevision {
  revisionNumber: number;
  body: string;
  changedAt: string;
  changedBy: number;
  changedByName: string;
}

function dataOf<T>(response: { data: ApiResponse<T> }, message: string): T {
  if (!response.data.success || response.data.data === undefined || response.data.data === null) {
    throw new Error(response.data.message ?? message);
  }
  return response.data.data;
}

export const courseForumApi = {
  async getTopics(courseId: number | string, page = 0, size = 20): Promise<ForumTopicPage> {
    return dataOf(await api.get<ApiResponse<ForumTopicPage>>(`/courses/${courseId}/forum/topics`, { params: { page, size } }), "Forum mavzularini yuklab bo'lmadi");
  },
  async getPosts(courseId: number | string, topicId: number, page = 0, size = 50): Promise<ForumPostPage> {
    return dataOf(await api.get<ApiResponse<ForumPostPage>>(`/courses/${courseId}/forum/topics/${topicId}`, { params: { page, size } }), "Forum javoblarini yuklab bo'lmadi");
  },
  async createTopic(courseId: number | string, title: string, body: string): Promise<ForumTopic> {
    return dataOf(await api.post<ApiResponse<ForumTopic>>(`/courses/${courseId}/forum/topics`, { title, body }), "Forum mavzusini yaratib bo'lmadi");
  },
  async createPost(courseId: number | string, topicId: number, body: string, replyToId?: number): Promise<ForumPost> {
    return dataOf(await api.post<ApiResponse<ForumPost>>(`/courses/${courseId}/forum/topics/${topicId}/posts`, { body, replyToId }), "Forum javobini saqlab bo'lmadi");
  },
  async editPost(courseId: number | string, topicId: number, postId: number, body: string): Promise<ForumPost> {
    return dataOf(await api.put<ApiResponse<ForumPost>>(`/courses/${courseId}/forum/topics/${topicId}/posts/${postId}`, { body }), "Forum postini yangilab bo'lmadi");
  },
  async hidePost(courseId: number | string, topicId: number, postId: number, reason: string): Promise<ForumPost> {
    return dataOf(await api.patch<ApiResponse<ForumPost>>(`/courses/${courseId}/forum/topics/${topicId}/posts/${postId}/hide`, { reason }), "Forum postini yashirib bo'lmadi");
  },
  async moderateTopic(courseId: number | string, topicId: number, payload: { status?: ForumTopicStatus; pinned?: boolean }): Promise<ForumTopic> {
    return dataOf(await api.patch<ApiResponse<ForumTopic>>(`/courses/${courseId}/forum/topics/${topicId}/moderation`, payload), "Forum mavzusini boshqarib bo'lmadi");
  },
  async getRevisions(courseId: number | string, topicId: number, postId: number): Promise<ForumPostRevision[]> {
    return dataOf(await api.get<ApiResponse<ForumPostRevision[]>>(`/courses/${courseId}/forum/topics/${topicId}/posts/${postId}/revisions`), "Tahrir tarixini yuklab bo'lmadi");
  },
};
