import api, { type ApiResponse } from '@/lib/api';

export interface ChatContact {
  userId: number;
  fullName: string;
  username: string;
  roleName?: string | null;
}

export interface ChatMember {
  userId: number;
  fullName: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
}

export interface ChatConversation {
  id: number;
  type: 'DIRECT' | 'GROUP';
  title: string;
  status: 'ACTIVE' | 'ARCHIVED';
  members: ChatMember[];
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  canManage: boolean;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  replyToId?: number | null;
  replyToSenderName?: string | null;
  body?: string | null;
  hidden: boolean;
  hiddenReason?: string | null;
  sentAt: string;
  deliveredCount: number;
  readCount: number;
  recipientCount: number;
  mine: boolean;
  canHide: boolean;
}

export interface ChatMessagePage {
  conversation: ChatConversation;
  messages: ChatMessage[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  canSend: boolean;
}

function dataOf<T>(response: { data: ApiResponse<T> }, fallback: string): T {
  if (!response.data.success || response.data.data === undefined || response.data.data === null) {
    throw new Error(response.data.message ?? fallback);
  }
  return response.data.data;
}

export const chatApi = {
  async contacts(q?: string): Promise<ChatContact[]> {
    return dataOf(await api.get<ApiResponse<ChatContact[]>>('/chat/contacts', { params: q ? { q } : {} }), "Kontaktlarni yuklab bo'lmadi");
  },
  async conversations(): Promise<ChatConversation[]> {
    return dataOf(await api.get<ApiResponse<ChatConversation[]>>('/chat/conversations'), "Chatlarni yuklab bo'lmadi");
  },
  async createDirect(userId: number): Promise<ChatConversation> {
    return dataOf(await api.post<ApiResponse<ChatConversation>>('/chat/conversations/direct', { userId }), "Shaxsiy chatni ochib bo'lmadi");
  },
  async createGroup(title: string, memberIds: number[]): Promise<ChatConversation> {
    return dataOf(await api.post<ApiResponse<ChatConversation>>('/chat/conversations/groups', { title, memberIds }), "Guruh chatini yaratib bo'lmadi");
  },
  async updateMembers(conversationId: number, addMemberIds: number[], removeMemberIds: number[]): Promise<ChatConversation> {
    return dataOf(await api.patch<ApiResponse<ChatConversation>>(`/chat/conversations/${conversationId}/members`, { addMemberIds, removeMemberIds }), "A'zolarni yangilab bo'lmadi");
  },
  async messages(conversationId: number, page = 0, size = 50): Promise<ChatMessagePage> {
    return dataOf(await api.get<ApiResponse<ChatMessagePage>>(`/chat/conversations/${conversationId}/messages`, { params: { page, size } }), "Xabarlarni yuklab bo'lmadi");
  },
  async send(conversationId: number, body: string, replyToId?: number): Promise<ChatMessage> {
    return dataOf(await api.post<ApiResponse<ChatMessage>>(`/chat/conversations/${conversationId}/messages`, { body, replyToId }), "Xabarni yuborib bo'lmadi");
  },
  async markRead(conversationId: number, throughMessageId: number): Promise<ChatConversation> {
    return dataOf(await api.post<ApiResponse<ChatConversation>>(`/chat/conversations/${conversationId}/read`, { throughMessageId }), "O'qilganlikni saqlab bo'lmadi");
  },
  async hide(conversationId: number, messageId: number, reason: string): Promise<ChatMessage> {
    return dataOf(await api.patch<ApiResponse<ChatMessage>>(`/chat/conversations/${conversationId}/messages/${messageId}/hide`, { reason }), "Xabarni yashirib bo'lmadi");
  },
  async archive(conversationId: number): Promise<ChatConversation> {
    return dataOf(await api.patch<ApiResponse<ChatConversation>>(`/chat/conversations/${conversationId}/archive`), "Chatni arxivlab bo'lmadi");
  },
};
