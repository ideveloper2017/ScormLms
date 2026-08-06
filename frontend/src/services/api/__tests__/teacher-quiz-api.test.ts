import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import {
  teacherPortalApi,
  type TeacherQuizPayload,
  type TeacherQuizQuestionPayload,
  type TeacherTest,
} from '../teacher-portal-api';

vi.mock('@/lib/api');

const quiz: TeacherTest = {
  id: '7',
  title: 'Oraliq nazorat',
  courseTitle: 'Algoritmlar',
  courseId: '3',
  date: '2026-08-04T09:00:00Z',
  duration: 30,
  questions: 2,
  totalPoints: 3,
  allowedAttempts: 1,
  passingPercentage: 60,
  proctoring: true,
  proctorIds: ['20'],
  status: 'active',
  participants: 0,
};

describe('teacher quiz API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('savol banki elementini yaratadi', async () => {
    const payload: TeacherQuizQuestionPayload = {
      courseId: 3,
      text: '2 + 2?',
      type: 'SHORT_ANSWER',
      difficulty: 'EASY',
      points: 1,
      options: [],
      correctAnswer: '4',
    };
    const question = { id: '10', courseId: '3', courseTitle: 'Algoritmlar', ...payload };
    vi.mocked(api.post).mockResolvedValue({ data: question });
    await expect(teacherPortalApi.createQuestion(payload)).resolves.toEqual(question);
    expect(api.post).toHaveBeenCalledWith('/teachers/me/questions', payload);
  });

  it('kurs savollarini filter bilan yuklaydi', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    await expect(teacherPortalApi.getQuestions('3')).resolves.toEqual([]);
    expect(api.get).toHaveBeenCalledWith('/teachers/me/questions', { params: { courseId: '3' } });
  });

  it('savollar va baholash qoidalari bilan test yaratadi', async () => {
    const payload: TeacherQuizPayload = {
      courseId: 3,
      title: quiz.title,
      instructions: 'Barcha savollarga javob bering',
      opensAt: '2026-08-04T09:00:00Z',
      closesAt: '2026-08-04T10:00:00Z',
      durationMinutes: 30,
      allowedAttempts: 1,
      passingPercentage: 60,
      shuffleQuestions: true,
      showResult: true,
      proctoring: false,
      proctorIds: [],
      questionIds: [10, 11],
      status: 'PUBLISHED',
    };
    vi.mocked(api.post).mockResolvedValue({ data: quiz });
    await expect(teacherPortalApi.createTest(payload)).resolves.toEqual(quiz);
    expect(api.post).toHaveBeenCalledWith('/teachers/me/tests', payload);
  });

  it('quiz proktorlarini yuklaydi va yangilaydi', async () => {
    const assignment = { quizId: '7', proctors: [{ id: '20', username: 'proctor', fullName: 'Proktor' }] };
    vi.mocked(api.get).mockResolvedValueOnce({ data: assignment.proctors }).mockResolvedValueOnce({ data: assignment });
    vi.mocked(api.put).mockResolvedValue({ data: assignment });

    await expect(teacherPortalApi.getProctorCandidates()).resolves.toEqual(assignment.proctors);
    await expect(teacherPortalApi.getTestProctors('7')).resolves.toEqual(assignment);
    await expect(teacherPortalApi.updateTestProctors('7', ['20'])).resolves.toEqual(assignment);
    expect(api.put).toHaveBeenCalledWith('/teachers/me/tests/7/proctors', { userIds: [20] });
  });

  it('test urinishlari auditini yuklaydi', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    await expect(teacherPortalApi.getTestAttempts('7')).resolves.toEqual([]);
    expect(api.get).toHaveBeenCalledWith('/teachers/me/tests/7/attempts');
  });

  it("urinish mavjud bo'lmagan testni o'chirish APIini chaqiradi", async () => {
    vi.mocked(api.delete).mockResolvedValue({});
    await teacherPortalApi.deleteTest('7');
    expect(api.delete).toHaveBeenCalledWith('/teachers/me/tests/7');
  });
});
