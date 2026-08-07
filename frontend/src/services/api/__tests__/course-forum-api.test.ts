import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { courseForumApi } from '../course-forum-api';

vi.mock('@/lib/api');

describe('courseForumApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mavzular va postlarni sahifalab yuklaydi', async () => {
    const topics = { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0, canCreateTopic: true, canModerate: false };
    const posts = { topic: { id: 7 }, posts: [], page: 0, size: 50, totalElements: 0, totalPages: 0, canReply: true };
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: topics } }).mockResolvedValueOnce({ data: { success: true, data: posts } });

    await expect(courseForumApi.getTopics(3)).resolves.toEqual(topics);
    await expect(courseForumApi.getPosts(3, 7)).resolves.toEqual(posts);
    expect(api.get).toHaveBeenNthCalledWith(1, '/courses/3/forum/topics', { params: { page: 0, size: 20 } });
    expect(api.get).toHaveBeenNthCalledWith(2, '/courses/3/forum/topics/7', { params: { page: 0, size: 50 } });
  });

  it('mavzu va javob yaratish payloadlarini yuboradi', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true, data: { id: 7 } } }).mockResolvedValueOnce({ data: { success: true, data: { id: 11 } } });

    await courseForumApi.createTopic(3, 'Savol mavzusi', 'Savolning batafsil matni');
    await courseForumApi.createPost(3, 7, 'Javob matni', 10);
    expect(api.post).toHaveBeenNthCalledWith(1, '/courses/3/forum/topics', { title: 'Savol mavzusi', body: 'Savolning batafsil matni' });
    expect(api.post).toHaveBeenNthCalledWith(2, '/courses/3/forum/topics/7/posts', { body: 'Javob matni', replyToId: 10 });
  });

  it('tahrir moderatsiya yashirish va revision endpointlarini chaqiradi', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { success: true, data: { id: 11 } } });
    vi.mocked(api.patch).mockResolvedValue({ data: { success: true, data: { id: 7 } } });
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: [] } });

    await courseForumApi.editPost(3, 7, 11, 'Yangi matn');
    await courseForumApi.hidePost(3, 7, 11, 'Qoidaga zid post');
    await courseForumApi.moderateTopic(3, 7, { status: 'LOCKED', pinned: true });
    await courseForumApi.getRevisions(3, 7, 11);
    expect(api.put).toHaveBeenCalledWith('/courses/3/forum/topics/7/posts/11', { body: 'Yangi matn' });
    expect(api.patch).toHaveBeenNthCalledWith(1, '/courses/3/forum/topics/7/posts/11/hide', { reason: 'Qoidaga zid post' });
    expect(api.patch).toHaveBeenNthCalledWith(2, '/courses/3/forum/topics/7/moderation', { status: 'LOCKED', pinned: true });
    expect(api.get).toHaveBeenCalledWith('/courses/3/forum/topics/7/posts/11/revisions');
  });
});
