import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { proctorApi, type ProctorAttemptEvidence, type ProctorStats } from '../proctor-api';

vi.mock('@/lib/api');

const ok = <T>(data: T) => ({ data: { success: true, data } });

describe('proctor API', () => {
  beforeEach(() => vi.clearAllMocks());

  it("vakolat doirasidagi monitoring ma'lumotlarini yuklaydi", async () => {
    const stats: ProctorStats = {
      activeExams: 1,
      totalStudents: 3,
      violations: 2,
      flaggedStudents: 1,
      completedToday: 4,
      avgScore: 82.5,
    };
    vi.mocked(api.get)
      .mockResolvedValueOnce(ok(stats))
      .mockResolvedValueOnce(ok([]))
      .mockResolvedValueOnce(ok([]))
      .mockResolvedValueOnce(ok([]));

    await expect(proctorApi.getStats()).resolves.toEqual(stats);
    await expect(proctorApi.getActiveExams()).resolves.toEqual([]);
    await expect(proctorApi.getSessions()).resolves.toEqual([]);
    await expect(proctorApi.getViolations()).resolves.toEqual([]);

    expect(api.get).toHaveBeenNthCalledWith(1, '/proctors/me/stats');
    expect(api.get).toHaveBeenNthCalledWith(2, '/proctors/me/active-exams');
    expect(api.get).toHaveBeenNthCalledWith(3, '/proctors/me/sessions');
    expect(api.get).toHaveBeenNthCalledWith(4, '/proctors/me/violations');
  });

  it('attempt dalilini aniq endpointdan yuklaydi', async () => {
    const evidence: ProctorAttemptEvidence = {
      attemptId: '91',
      quizId: '7',
      examTitle: 'Oraliq nazorat',
      course: 'Algoritmlar',
      studentName: 'Talaba',
      attemptStatus: 'IN_PROGRESS',
      startedAt: '2026-08-06T08:00:00Z',
      expiresAt: '2026-08-06T08:30:00Z',
      score: 0,
      totalPoints: 10,
      challengeDirection: 'left',
      events: [],
    };
    vi.mocked(api.get).mockResolvedValue(ok(evidence));

    await expect(proctorApi.getEvidence('91')).resolves.toEqual(evidence);
    expect(api.get).toHaveBeenCalledWith('/proctors/me/sessions/91');
  });

  it('muvaffaqiyatsiz server javobini xato sifatida qaytaradi', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: false, message: "Ruxsat yo'q" } });

    await expect(proctorApi.getSessions()).rejects.toThrow("Ruxsat yo'q");
  });

  it("vakolatli proktor apellyatsiyalarni ko'rib chiqadi", async () => {
    const appeal = {
      id: '4', attemptId: '91', quizId: '7', examTitle: 'Oraliq nazorat', course: 'Algoritmlar',
      studentName: 'Talaba', reason: 'Tarmoq uzildi', requestedAt: '2026-08-06T08:31:00Z',
      status: 'pending' as const, disputedEvents: [],
    };
    vi.mocked(api.get).mockResolvedValue(ok([appeal]));
    vi.mocked(api.post).mockResolvedValue(ok({ ...appeal, status: 'approved', decision: 'Uzrli sabab' }));

    await expect(proctorApi.getAppeals()).resolves.toEqual([appeal]);
    await expect(proctorApi.reviewAppeal('4', 'APPROVED', 'Uzrli sabab')).resolves.toMatchObject({ status: 'approved' });
    expect(api.get).toHaveBeenCalledWith('/proctors/me/appeals');
    expect(api.post).toHaveBeenCalledWith('/proctors/me/appeals/4/review', {
      status: 'APPROVED', decision: 'Uzrli sabab',
    });
  });
});
