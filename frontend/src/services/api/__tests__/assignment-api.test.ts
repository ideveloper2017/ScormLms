import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { assignmentApi, AssignmentSubmission } from '../assignment-api';
import api from '@/lib/api';
import { handleApiError } from '@/utils/error-handler';
import type { Assignment, AssignmentDetails } from '@/types/assignment.types';

// Mock dependencies
vi.mock('@/lib/api');
vi.mock('@/utils/error-handler');

describe('assignmentApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchAssignments', () => {
    it('should fetch assignments successfully with filters', async () => {
      const mockAssignments: Assignment[] = [
        {
          id: '1',
          title: 'Math Homework',
          description: 'Complete exercises 1-10',
          courseId: 'c1',
          courseName: 'Mathematics',
          dueDate: new Date('2024-12-31'),
          status: 'pending',
          priority: 'high',
          maxScore: 100,
        },
        {
          id: '2',
          title: 'Physics Lab Report',
          description: 'Submit lab findings',
          courseId: 'c2',
          courseName: 'Physics',
          dueDate: new Date('2024-12-25'),
          status: 'submitted',
          priority: 'medium',
          maxScore: 50,
          submittedAt: new Date('2024-12-20'),
        },
      ];

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockAssignments },
      });

      const filters = { status: 'pending' as const };
      const result = await assignmentApi.fetchAssignments(filters);

      expect(api.get).toHaveBeenCalledWith('/students/me/assignments', {
        params: filters,
      });
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Math Homework');
      expect(result[0].dueDate).toBeInstanceOf(Date);
    });

    it('should fetch assignments without filters', async () => {
      const mockAssignments: Assignment[] = [];

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockAssignments },
      });

      const result = await assignmentApi.fetchAssignments();

      expect(api.get).toHaveBeenCalledWith('/students/me/assignments', {
        params: undefined,
      });
      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(assignmentApi.fetchAssignments()).rejects.toThrow('Network error');
      expect(handleApiError).toHaveBeenCalledWith(error, {
        customMessage: 'Topshiriqlarni yuklashda xatolik yuz berdi',
      });
    });

    it('should throw error when response is unsuccessful', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: false, message: 'Failed to fetch' },
      });

      await expect(assignmentApi.fetchAssignments()).rejects.toThrow('Failed to fetch');
    });
  });

  describe('fetchAssignmentById', () => {
    it('should fetch assignment details successfully', async () => {
      const mockAssignment: AssignmentDetails = {
        id: '1',
        title: 'Math Homework',
        description: 'Complete exercises 1-10',
        courseId: 'c1',
        courseName: 'Mathematics',
        dueDate: new Date('2024-12-31'),
        status: 'pending',
        priority: 'high',
        maxScore: 100,
        instructions: 'Show all work',
        attachments: [
          {
            id: 'a1',
            name: 'worksheet.pdf',
            url: 'https://example.com/worksheet.pdf',
            size: 1024,
            uploadedAt: new Date('2024-12-01'),
          },
        ],
        submissionType: 'file',
        rubric: [
          {
            criterion: 'Accuracy',
            points: 50,
            description: 'Correct answers',
          },
        ],
      };

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockAssignment },
      });

      const result = await assignmentApi.fetchAssignmentById('1');

      expect(api.get).toHaveBeenCalledWith('/assignments/1');
      expect(result.id).toBe('1');
      expect(result.title).toBe('Math Homework');
      expect(result.dueDate).toBeInstanceOf(Date);
      expect(result.attachments[0].uploadedAt).toBeInstanceOf(Date);
      expect(result.rubric).toBeDefined();
    });

    it('should handle errors when fetching assignment details', async () => {
      const error = new Error('Not found');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(assignmentApi.fetchAssignmentById('999')).rejects.toThrow('Not found');
      expect(handleApiError).toHaveBeenCalledWith(error, {
        customMessage: 'Topshiriq ma\'lumotlarini yuklashda xatolik yuz berdi',
      });
    });
  });

  describe('submitAssignment', () => {
    it('should submit assignment with file upload using FormData', async () => {
      const mockFile = new File(['content'], 'submission.pdf', { type: 'application/pdf' });
      const payload = {
        fileUrl: mockFile,
        answer: 'My answer',
        submittedAt: new Date('2024-12-20'),
      };

      vi.mocked(api.post).mockResolvedValue({
        data: { success: true },
      });

      await assignmentApi.submitAssignment('1', payload);

      expect(api.post).toHaveBeenCalledWith(
        '/assignments/1/submit',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    });

    it('should submit assignment with file URL using FormData', async () => {
      const payload = {
        fileUrl: 'https://example.com/file.pdf',
        submittedAt: new Date('2024-12-20'),
      };

      vi.mocked(api.post).mockResolvedValue({
        data: { success: true },
      });

      await assignmentApi.submitAssignment('1', payload);

      expect(api.post).toHaveBeenCalledWith(
        '/assignments/1/submit',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    });

    it('should submit assignment with text only', async () => {
      const payload = {
        answer: 'My text answer',
        submittedAt: new Date('2024-12-20'),
      };

      vi.mocked(api.post).mockResolvedValue({
        data: { success: true },
      });

      await assignmentApi.submitAssignment('1', payload);

      expect(api.post).toHaveBeenCalledWith('/assignments/1/submit', {
        answer: 'My text answer',
        submittedAt: payload.submittedAt.toISOString(),
      });
    });

    it('should handle submission errors', async () => {
      const payload = {
        answer: 'My answer',
        submittedAt: new Date('2024-12-20'),
      };
      const error = new Error('Submission failed');
      vi.mocked(api.post).mockRejectedValue(error);

      await expect(assignmentApi.submitAssignment('1', payload)).rejects.toThrow(
        'Submission failed'
      );
      expect(handleApiError).toHaveBeenCalledWith(error, {
        customMessage: 'Topshiriqni topshirishda xatolik yuz berdi',
      });
    });

    it('should throw error when submission response is unsuccessful', async () => {
      const payload = {
        answer: 'My answer',
        submittedAt: new Date('2024-12-20'),
      };

      vi.mocked(api.post).mockResolvedValue({
        data: { success: false, message: 'Validation failed' },
      });

      await expect(assignmentApi.submitAssignment('1', payload)).rejects.toThrow(
        'Validation failed'
      );
    });
  });

  describe('fetchSubmissionHistory', () => {
    it('should fetch submission history successfully', async () => {
      const mockSubmissions: AssignmentSubmission[] = [
        {
          id: 's1',
          assignmentId: 'a1',
          studentId: 'st1',
          answer: 'First submission',
          submittedAt: new Date('2024-12-15'),
          status: 'graded',
          grade: 85,
          feedback: 'Good work',
        },
        {
          id: 's2',
          assignmentId: 'a1',
          studentId: 'st1',
          fileUrl: 'https://example.com/submission2.pdf',
          submittedAt: new Date('2024-12-20'),
          status: 'submitted',
        },
      ];

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockSubmissions },
      });

      const result = await assignmentApi.fetchSubmissionHistory('a1');

      expect(api.get).toHaveBeenCalledWith('/assignments/a1/submissions');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('s1');
      expect(result[0].submittedAt).toBeInstanceOf(Date);
      expect(result[0].grade).toBe(85);
    });

    it('should handle errors when fetching submission history', async () => {
      const error = new Error('Failed to fetch');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(assignmentApi.fetchSubmissionHistory('a1')).rejects.toThrow(
        'Failed to fetch'
      );
      expect(handleApiError).toHaveBeenCalledWith(error, {
        customMessage: 'Topshiriq tarixini yuklashda xatolik yuz berdi',
      });
    });
  });

  describe('deleteSubmission', () => {
    it('should delete submission successfully', async () => {
      vi.mocked(api.delete).mockResolvedValue({
        data: { success: true },
      });

      await assignmentApi.deleteSubmission('s1');

      expect(api.delete).toHaveBeenCalledWith('/submissions/s1');
    });

    it('should handle deletion errors', async () => {
      const error = new Error('Delete failed');
      vi.mocked(api.delete).mockRejectedValue(error);

      await expect(assignmentApi.deleteSubmission('s1')).rejects.toThrow('Delete failed');
      expect(handleApiError).toHaveBeenCalledWith(error, {
        customMessage: 'Topshiriqni o\'chirishda xatolik yuz berdi',
      });
    });

    it('should throw error when deletion response is unsuccessful', async () => {
      vi.mocked(api.delete).mockResolvedValue({
        data: { success: false, message: 'Not allowed' },
      });

      await expect(assignmentApi.deleteSubmission('s1')).rejects.toThrow('Not allowed');
    });
  });
});
