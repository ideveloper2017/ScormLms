import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import {
  teacherPortalApi,
  type TeacherAssignment,
  type TeacherAssignmentPayload,
  type TeacherSubmission,
} from '../teacher-portal-api';

vi.mock('@/lib/api');

const assignment: TeacherAssignment = {
  id: '12',
  title: 'REST API yozish',
  description: 'CRUD endpointlar yarating',
  courseTitle: 'Dasturlash',
  courseId: '4',
  dueDate: '2026-08-05T12:00:00Z',
  maxScore: 100,
  priority: 'high',
  submissionType: 'both',
  totalSubmissions: 1,
  pendingGrade: 1,
  status: 'active',
};

const submission: TeacherSubmission = {
  id: '31',
  assignmentId: '12',
  studentName: 'Test Talaba',
  assignmentTitle: 'REST API yozish',
  courseTitle: 'Dasturlash',
  submittedAt: '2026-08-04T12:00:00Z',
  status: 'pending',
  maxScore: 100,
  answer: 'Tayyor',
  attemptNumber: 1,
};

describe('teacher assignment API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('topshiriq yaratadi', async () => {
    const payload: TeacherAssignmentPayload = {
      courseId: 4,
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.description,
      dueDate: assignment.dueDate,
      maxScore: 100,
      priority: 'HIGH',
      submissionType: 'BOTH',
      status: 'PUBLISHED',
    };
    vi.mocked(api.post).mockResolvedValue({ data: assignment });
    await expect(teacherPortalApi.createAssignment(payload)).resolves.toEqual(assignment);
    expect(api.post).toHaveBeenCalledWith('/teachers/me/assignments', payload);
  });

  it('faqat tanlangan topshiriq submissionlarini yuklaydi', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [submission] });
    await expect(teacherPortalApi.getSubmissions('12')).resolves.toEqual([submission]);
    expect(api.get).toHaveBeenCalledWith('/teachers/me/submissions', { params: { assignmentId: '12' } });
  });

  it('ball va feedbackni serverga yuboradi', async () => {
    const graded = { ...submission, status: 'graded' as const, score: 87, feedback: 'Yaxshi' };
    vi.mocked(api.post).mockResolvedValue({ data: graded });
    await expect(teacherPortalApi.gradeSubmission('31', 87, 'Yaxshi')).resolves.toEqual(graded);
    expect(api.post).toHaveBeenCalledWith('/teachers/me/submissions/31/grade', { score: 87, feedback: 'Yaxshi' });
  });

  it("topshiriqni o'chiradi", async () => {
    vi.mocked(api.delete).mockResolvedValue({});
    await teacherPortalApi.deleteAssignment('12');
    expect(api.delete).toHaveBeenCalledWith('/teachers/me/assignments/12');
  });
});
