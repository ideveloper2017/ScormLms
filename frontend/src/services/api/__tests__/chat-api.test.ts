import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { chatApi } from '../chat-api';

vi.mock('@/lib/api');

describe('chatApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('kontakt va conversationlarni real endpointdan oladi', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [{ userId: 7 }] } }).mockResolvedValueOnce({ data: { success: true, data: [{ id: 3 }] } });
    await chatApi.contacts('ali');
    await chatApi.conversations();
    expect(api.get).toHaveBeenNthCalledWith(1, '/chat/contacts', { params: { q: 'ali' } });
    expect(api.get).toHaveBeenNthCalledWith(2, '/chat/conversations');
  });

  it('direct va guruh chat yaratadi hamda azolarni yangilaydi', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: { id: 3 } } });
    vi.mocked(api.patch).mockResolvedValue({ data: { success: true, data: { id: 4 } } });
    await chatApi.createDirect(7);
    await chatApi.createGroup('Loyiha', [7, 8]);
    await chatApi.updateMembers(4, [9], [8]);
    expect(api.post).toHaveBeenNthCalledWith(1, '/chat/conversations/direct', { userId: 7 });
    expect(api.post).toHaveBeenNthCalledWith(2, '/chat/conversations/groups', { title: 'Loyiha', memberIds: [7, 8] });
    expect(api.patch).toHaveBeenCalledWith('/chat/conversations/4/members', { addMemberIds: [9], removeMemberIds: [8] });
  });

  it('xabar delivery-read va hide endpointlarini chaqiradi', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { messages: [] } } });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: { id: 11 } } });
    vi.mocked(api.patch).mockResolvedValue({ data: { success: true, data: { id: 11 } } });
    await chatApi.messages(3);
    await chatApi.send(3, 'Salom', 10);
    await chatApi.markRead(3, 11);
    await chatApi.hide(3, 11, 'Muallif qaytarib oldi');
    await chatApi.archive(3);
    expect(api.get).toHaveBeenCalledWith('/chat/conversations/3/messages', { params: { page: 0, size: 50 } });
    expect(api.post).toHaveBeenNthCalledWith(1, '/chat/conversations/3/messages', { body: 'Salom', replyToId: 10 });
    expect(api.post).toHaveBeenNthCalledWith(2, '/chat/conversations/3/read', { throughMessageId: 11 });
    expect(api.patch).toHaveBeenNthCalledWith(1, '/chat/conversations/3/messages/11/hide', { reason: 'Muallif qaytarib oldi' });
    expect(api.patch).toHaveBeenNthCalledWith(2, '/chat/conversations/3/archive');
  });
});
