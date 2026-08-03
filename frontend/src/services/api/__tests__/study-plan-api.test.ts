import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { studyPlanApi, type StudyPlan } from '../study-plan-api';

vi.mock('@/lib/api');

describe('studyPlanApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it("talabaning individual o'quv rejasini yuklaydi", async () => {
    const plan: StudyPlan = {
      studentId: 7,
      studentNumber: 'ST-007',
      studentName: 'Test Talaba',
      academicYear: '2026-2027',
      totalCredits: 6,
      completedCredits: 0,
      overallProgress: 50,
      courses: [{
        enrollmentId: 11,
        courseId: 3,
        title: 'Algoritmlar',
        subjectName: 'Algoritmlar nazariyasi',
        instructor: "Test O'qituvchi",
        academicYear: '2026-2027',
        semester: 2,
        credits: 6,
        required: true,
        status: 'active',
        progress: 50,
        completedContents: 0,
        totalContents: 1,
        completedScormPackages: 0,
        totalScormPackages: 0,
      }],
    };
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: plan } });

    await expect(studyPlanApi.getMyPlan('2026-2027')).resolves.toEqual(plan);
    expect(api.get).toHaveBeenCalledWith('/students/me/study-plan', { params: { academicYear: '2026-2027' } });
  });

  it('kontent bajarilishini progress endpointiga yuboradi', async () => {
    const result = {
      courseId: 3,
      progress: 100,
      completedContents: 1,
      totalContents: 1,
      completedScormPackages: 0,
      totalScormPackages: 0,
      status: 'completed' as const,
    };
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: result } });

    await expect(studyPlanApi.recordContentProgress(3, 9)).resolves.toEqual(result);
    expect(api.post).toHaveBeenCalledWith('/students/me/courses/3/contents/9/progress', { progress: 100 });
  });

  it("muvaffaqiyatsiz javobni xato sifatida qaytaradi", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: false, message: "O'quv reja topilmadi" } });
    await expect(studyPlanApi.getMyPlan()).rejects.toThrow("O'quv reja topilmadi");
  });
});
