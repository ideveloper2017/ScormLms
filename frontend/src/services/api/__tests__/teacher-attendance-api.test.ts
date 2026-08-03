import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { teacherPortalApi, type AttendanceSessionPayload, type TeacherAttendance } from '../teacher-portal-api';

vi.mock('@/lib/api');

const session: TeacherAttendance = {
  id: 9,
  courseId: 4,
  date: '2026-08-04T04:00:00Z',
  courseTitle: 'Masofaviy matematika',
  group: 'M-01',
  sessionTitle: '1-mavzu faolligi',
  opensAt: '2026-08-04T04:00:00Z',
  closesAt: '2026-08-04T06:00:00Z',
  minimumActivitySeconds: 60,
  status: 'closed',
  present: 20,
  late: 2,
  absent: 3,
  pending: 0,
  total: 25,
};

describe('teacher attendance API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('faollik asosidagi davomat oynalarini yuklaydi', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [session] });
    await expect(teacherPortalApi.getAttendance()).resolves.toEqual([session]);
    expect(api.get).toHaveBeenCalledWith('/teachers/me/attendance');
  });

  it('davomat oynasini yaratadi', async () => {
    const payload: AttendanceSessionPayload = {
      courseId: 4,
      title: '1-mavzu faolligi',
      opensAt: session.opensAt,
      closesAt: session.closesAt,
      minimumActivitySeconds: 60,
    };
    vi.mocked(api.post).mockResolvedValue({ data: session });
    await expect(teacherPortalApi.createAttendanceSession(payload)).resolves.toEqual(session);
    expect(api.post).toHaveBeenCalledWith('/teachers/me/attendance/sessions', payload);
  });

  it("davomat oynasini o'chiradi", async () => {
    vi.mocked(api.delete).mockResolvedValue({});
    await teacherPortalApi.deleteAttendanceSession(9);
    expect(api.delete).toHaveBeenCalledWith('/teachers/me/attendance/sessions/9');
  });
});
