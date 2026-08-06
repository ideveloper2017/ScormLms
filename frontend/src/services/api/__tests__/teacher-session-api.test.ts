import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { teacherPortalApi, type TeacherLearningSessionPayload } from '../teacher-portal-api';

vi.mock('@/lib/api');

describe('teacher learning session API', () => {
  beforeEach(() => vi.clearAllMocks());

  const payload: TeacherLearningSessionPayload = {
    courseId: 4,
    title: 'Jonli amaliyot',
    description: 'Zoom orqali',
    format: 'SYNCHRONOUS',
    sessionType: 'TUTORIAL',
    startsAt: '2026-08-06T09:00:00Z',
    endsAt: '2026-08-06T10:30:00Z',
    liveUrl: 'https://meet.example.edu/1',
    status: 'PUBLISHED',
  };

  it('mashgulot yaratadi', async () => {
    const response = { id: '18', ...payload, courseId: '4', courseTitle: 'Algoritmlar', format: 'synchronous', sessionType: 'tutorial', status: 'published', accessCount: 0 };
    vi.mocked(api.post).mockResolvedValue({ data: response });
    await expect(teacherPortalApi.createLearningSession(payload)).resolves.toEqual(response);
    expect(api.post).toHaveBeenCalledWith('/teachers/me/sessions', payload);
  });

  it('kurs boyicha mashgulotlarni yuklaydi', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    await expect(teacherPortalApi.getLearningSessions('4')).resolves.toEqual([]);
    expect(api.get).toHaveBeenCalledWith('/teachers/me/sessions', { params: { courseId: '4' } });
  });

  it('mashgulot holatini yangilaydi', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { id: '18', status: 'completed' } });
    await teacherPortalApi.updateLearningSessionStatus('18', 'COMPLETED');
    expect(api.patch).toHaveBeenCalledWith('/teachers/me/sessions/18/status', { status: 'COMPLETED' });
  });

  it('draft mashgulotni ochiradi', async () => {
    vi.mocked(api.delete).mockResolvedValue({});
    await teacherPortalApi.deleteLearningSession('18');
    expect(api.delete).toHaveBeenCalledWith('/teachers/me/sessions/18');
  });
});
