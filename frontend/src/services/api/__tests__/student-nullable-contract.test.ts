import { describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { courseApi } from '../course-api';
import { dashboardApi } from '../dashboard-api';
import { AssignmentSchema, AssignmentSubmissionSchema } from '@/types/schemas/assignment.schema';
import { TestSchema } from '@/types/schemas/test.schema';
import { AttendanceRecordSchema } from '@/types/schemas/attendance.schema';
import { GradeSchema } from '@/types/schemas/grade.schema';

vi.mock('@/lib/api');
vi.mock('@/utils/error-handler');

describe('Kotlin student response contracts', () => {
  it('keeps courses without images or grades on both student screens', async () => {
    const course = { id: '3', title: 'Mexanika', description: '', instructor: 'Teacher',
      progress: 33, grade: null, status: 'active', credits: 4, imageUrl: null };
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: [course] } });
    for (const rows of [await courseApi.fetchCourses(), await dashboardApi.fetchRecentCourses()]) {
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ title: 'Mexanika', progress: 33, grade: undefined, imageUrl: undefined });
    }
  });

  it('keeps pending assignments without grades and does not invent a submission date', () => {
    const task = AssignmentSchema.parse({ id: '1', title: 'Task', description: '', courseId: '3',
      courseName: 'Mexanika', dueDate: '2026-09-10T10:00:00Z', status: 'pending', priority: 'medium',
      maxScore: 100, grade: null, submittedAt: null, feedback: null });
    expect(task.submittedAt).toBeUndefined();
    expect(task.grade).toBeUndefined();
  });

  it('accepts text-only submissions and preserves a real zero grade', () => {
    const result = AssignmentSubmissionSchema.parse({ id: '1', assignmentId: '2', studentId: '3',
      fileUrl: null, fileName: null, answer: 'Answer', submittedAt: '2026-09-07T10:00:00Z',
      grade: 0, feedback: null, status: 'graded' });
    expect(result.grade).toBe(0);
    expect(result.fileUrl).toBeUndefined();
  });

  it('keeps upcoming tests without a score', () => {
    expect(TestSchema.parse({ id: '1', title: 'Test', courseId: '3', courseName: 'Mexanika',
      date: '2026-09-10', startTime: '09:00', endTime: '10:00', duration: 60, questionCount: 2,
      totalPoints: 100, proctoring: false, status: 'upcoming', score: null }).score).toBeUndefined();
  });

  it('keeps attendance and grades with missing optional fields', () => {
    expect(AttendanceRecordSchema.parse({ id: '1', courseId: '3', courseName: 'Mexanika', date: '2026-09-07',
      status: 'present', reason: null, checkInTime: null, checkOutTime: null }).checkInTime).toBeUndefined();
    expect(GradeSchema.parse({ id: 'exam-1', courseId: '3', courseName: 'Mexanika', assignmentId: null,
      assignmentName: null, testId: null, testName: 'Final exam', gradeLetter: 'F', gradePoints: 0,
      scorePercentage: 0, maxScore: 100, earnedScore: 0, date: '2026-09-07', feedback: null }).earnedScore).toBe(0);
  });

  it('continues to reject invalid required fields', () => {
    expect(TestSchema.safeParse({ id: null, title: 'Test' }).success).toBe(false);
  });
});
