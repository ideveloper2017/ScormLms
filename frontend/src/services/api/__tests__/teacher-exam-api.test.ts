import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { teacherExamApi, type CreateExamSessionPayload } from '../teacher-exam-api';

vi.mock('@/lib/api');

describe('teacher final exam API', () => {
  beforeEach(() => vi.clearAllMocks());
  it('sessiya yaratadi va royxatni oladi', async () => {
    const payload: CreateExamSessionPayload = { courseId: 4, title: 'Yakuniy', examDate: '2026-08-06', examTime: '10:00', location: '101', examType: 'WRITTEN', durationMinutes: 120 };
    vi.mocked(api.post).mockResolvedValue({ data: { id: '8' } });
    await teacherExamApi.create(payload);
    expect(api.post).toHaveBeenCalledWith('/teachers/me/exams', payload);
    vi.mocked(api.get).mockResolvedValue({ data: { attendanceRecords: [] } });
    await teacherExamApi.attendance('8');
    expect(api.get).toHaveBeenCalledWith('/teachers/me/exams/8/attendance');
  });
  it('davomatni serverga yuboradi', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { status: 'PRESENT' } });
    await teacherExamApi.recordAttendance('8', '11', 'PRESENT');
    expect(api.put).toHaveBeenCalledWith('/teachers/me/exams/8/attendance/11', { attendanceStatus: 'PRESENT' });
  });
  it('natijani maksimal ball bilan yuboradi', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { score: 85 } });
    await teacherExamApi.recordResult('8', '11', 85);
    expect(api.put).toHaveBeenCalledWith('/teachers/me/exams/8/results/11', { enrollmentId: 11, score: 85, totalScore: 100 });
  });
  it('apellyatsiyani korib chiqadi', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { status: 'APPROVED' } });
    await teacherExamApi.reviewAppeal('5', 'APPROVED', 'Qayta tekshirildi', 88);
    expect(api.post).toHaveBeenCalledWith('/teachers/me/exams/appeals/5/review', { status: 'APPROVED', decision: 'Qayta tekshirildi', newScore: 88 });
  });
});
