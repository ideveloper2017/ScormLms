import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { exportStudentRegistry, listReinstatementSubjectReport, listStudents } from '../student-api';

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe('student registry server API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends search status and pagination to the server', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: {
      items: [{ id: 1, studentNumber: 'S-1', fullName: 'Ali Valiyev' }],
      page: 1, size: 20, totalElements: 25, totalPages: 2,
    } } as never);
    const result = await listStudents({ search: 'Ali', status: 'ACTIVE', page: 1, size: 20 });
    expect(api.get).toHaveBeenCalledWith('/students', { params: { search: 'Ali', status: 'ACTIVE', page: 1, size: 20 } });
    expect(result.totalElements).toBe(25);
  });

  it('downloads the filtered XLSX filename from content disposition', async () => {
    const blob = new Blob(['xlsx'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    vi.mocked(api.get).mockResolvedValueOnce({
      data: blob,
      headers: { 'content-disposition': 'attachment; filename="student-registry-2026-08-08.xlsx"' },
    } as never);
    const file = await exportStudentRegistry({ search: 'Ali', status: 'ACTIVE' });
    expect(api.get).toHaveBeenCalledWith('/students/export', {
      params: { search: 'Ali', status: 'ACTIVE' }, responseType: 'blob',
    });
    expect(file.filename).toBe('student-registry-2026-08-08.xlsx');
    expect(file.blob).toBe(blob);
  });

  it('loads the reinstated student subject report with server filters', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: {
      items: [{ reinstatementEventId: 9, studentId: 1, studentNumber: 'S-1', studentName: 'Ali Valiyev', subjects: [] }],
      page: 0, size: 20, totalElements: 1, totalPages: 1,
    } } as never);
    const result = await listReinstatementSubjectReport({ search: 'Ali', academicYear: '2026-2027', page: 0, size: 20 });
    expect(api.get).toHaveBeenCalledWith('/students/reinstatements/subjects-report', {
      params: { search: 'Ali', academicYear: '2026-2027', page: 0, size: 20 },
    });
    expect(result.items[0].reinstatementEventId).toBe(9);
  });
});
