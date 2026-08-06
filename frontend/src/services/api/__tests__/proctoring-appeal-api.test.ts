import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { proctoringAppealApi } from '../proctoring-appeal-api';

vi.mock('@/lib/api');

describe('student proctoring appeal API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('attempt contextini yuklaydi va tanlangan eventlar bilan appeal yuboradi', async () => {
    const appeal = {
      id: '4', attemptId: '91', quizId: '7', examTitle: 'Oraliq nazorat', course: 'Algoritmlar',
      studentName: 'Talaba', reason: 'Tarmoq uzildi', requestedAt: '2026-08-06T08:31:00Z',
      status: 'pending', disputedEvents: [],
    };
    const context = {
      attemptId: '91', quizId: '7', eligible: true, deadline: '2026-08-16T08:30:00Z',
      riskEvents: [{ id: '12', type: 'tab_hidden', severity: 'high', occurredAt: '2026-08-06T08:20:00Z' }],
    };
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: context } });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: appeal } });

    await expect(proctoringAppealApi.getContext('7', '91')).resolves.toEqual(context);
    await expect(proctoringAppealApi.create('7', '91', 'Tarmoq uzildi', ['12'])).resolves.toEqual(appeal);
    expect(api.get).toHaveBeenCalledWith('/tests/7/attempts/91/proctoring/appeal');
    expect(api.post).toHaveBeenCalledWith('/tests/7/attempts/91/proctoring/appeal', {
      reason: 'Tarmoq uzildi', eventIds: [12],
    });
  });
});
