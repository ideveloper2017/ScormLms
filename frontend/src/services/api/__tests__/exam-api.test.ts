import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { examApi } from '../exam-api';

vi.mock('@/lib/api');

describe('student final exam API', () => {
  beforeEach(() => vi.clearAllMocks());
  it('auditoriya imtihonlarini oladi', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    await expect(examApi.getExams()).resolves.toEqual([]);
    expect(api.get).toHaveBeenCalledWith('/students/me/exams');
  });
  it('apellyatsiya yuboradi', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: '7', status: 'PENDING' } });
    await examApi.createAppeal('12', 'Natijani qayta tekshiring');
    expect(api.post).toHaveBeenCalledWith('/students/me/exam-appeals', { examResultId: 12, reason: 'Natijani qayta tekshiring' });
  });
});
