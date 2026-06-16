import api from '@/lib/api';
import { handleApiError } from '@/utils/error-handler';
import type {
  Assignment,
  AssignmentDetails,
  SubmitAssignmentPayload,
} from '@/types/assignment.types';
import {
  AssignmentSchema,
  AssignmentsArraySchema,
  AssignmentDetailsSchema,
  AssignmentSubmissionSchema,
} from '@/types/schemas/assignment.schema';
import { validateDataOrFallback, validateDataOrThrow, validateArrayPartial } from '@/utils/validation';

/**
 * Assignment submission history record
 */
export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileUrl?: string;
  answer?: string;
  submittedAt: Date;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'returned';
}

/**
 * Filters for fetching assignments
 */
export interface AssignmentFilters {
  status?: 'pending' | 'submitted' | 'graded' | 'overdue';
  courseId?: string;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Assignment API Service
 * Handles all assignment-related API endpoints
 */
export const assignmentApi = {
  /**
   * Fetch all assignments for the current student with optional filters
   * GET /students/me/assignments
   * 
   * @param filters - Optional filters for assignments
   * @returns Promise<Assignment[]>
   */
  fetchAssignments: async (filters?: AssignmentFilters): Promise<Assignment[]> => {
    try {
      const response = await api.get<{ success: boolean; data: Assignment[] }>(
        '/students/me/assignments',
        { params: filters }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch assignments');
      }

      // Parse date strings to Date objects
      const parsedData = response.data.data.map(assignment => ({
        ...assignment,
        dueDate: new Date(assignment.dueDate),
        submittedAt: assignment.submittedAt ? new Date(assignment.submittedAt) : undefined,
      }));

      // Validate array with element-level filtering (Requirement 14.4)
      const validatedAssignments = validateArrayPartial(
        AssignmentSchema,
        parsedData,
        { context: 'assignmentApi.fetchAssignments', logErrors: true }
      );

      return validatedAssignments;
    } catch (error) {
      handleApiError(error, {
        customMessage: 'Topshiriqlarni yuklashda xatolik yuz berdi',
      });
      throw error;
    }
  },

  /**
   * Fetch assignment details by ID
   * GET /assignments/{id}
   * 
   * @param id - Assignment ID
   * @returns Promise<AssignmentDetails>
   */
  fetchAssignmentById: async (id: string): Promise<AssignmentDetails> => {
    try {
      const response = await api.get<{ success: boolean; data: AssignmentDetails }>(
        `/assignments/${id}`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch assignment details');
      }

      const assignment = response.data.data;

      // Parse date strings to Date objects
      const parsedData = {
        ...assignment,
        dueDate: new Date(assignment.dueDate),
        submittedAt: assignment.submittedAt ? new Date(assignment.submittedAt) : undefined,
        attachments: assignment.attachments.map(att => ({
          ...att,
          uploadedAt: new Date(att.uploadedAt),
        })),
      };

      // Validate with Zod schema
      const validatedAssignment = validateDataOrThrow(
        AssignmentDetailsSchema,
        parsedData,
        { context: 'assignmentApi.fetchAssignmentById', logErrors: true }
      );

      return validatedAssignment;
    } catch (error) {
      handleApiError(error, {
        customMessage: 'Topshiriq ma\'lumotlarini yuklashda xatolik yuz berdi',
      });
      throw error;
    }
  },

  /**
   * Submit an assignment with file upload support
   * POST /assignments/{id}/submit
   * 
   * Supports both file uploads and text submissions
   * 
   * @param id - Assignment ID
   * @param payload - Submission data (file or text)
   * @returns Promise<void>
   */
  submitAssignment: async (
    id: string,
    payload: SubmitAssignmentPayload
  ): Promise<void> => {
    try {
      // If file is provided, use FormData for file upload
      if (payload.fileUrl) {
        const formData = new FormData();
        
        // If fileUrl is a File object, append it directly
        if (payload.fileUrl instanceof File) {
          formData.append('file', payload.fileUrl);
        } else {
          // If it's a URL string, send as regular JSON
          formData.append('fileUrl', payload.fileUrl);
        }

        if (payload.answer) {
          formData.append('answer', payload.answer);
        }

        formData.append('submittedAt', payload.submittedAt.toISOString());

        const response = await api.post<{ success: boolean; message?: string }>(
          `/assignments/${id}/submit`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (!response.data.success) {
          throw new Error(response.data.message || 'Submission failed');
        }
      } else {
        // Text-only submission
        const response = await api.post<{ success: boolean; message?: string }>(
          `/assignments/${id}/submit`,
          {
            answer: payload.answer,
            submittedAt: payload.submittedAt.toISOString(),
          }
        );

        if (!response.data.success) {
          throw new Error(response.data.message || 'Submission failed');
        }
      }
    } catch (error) {
      handleApiError(error, {
        customMessage: 'Topshiriqni topshirishda xatolik yuz berdi',
      });
      throw error;
    }
  },

  /**
   * Fetch submission history for an assignment
   * GET /assignments/{id}/submissions
   * 
   * @param id - Assignment ID
   * @returns Promise<AssignmentSubmission[]>
   */
  fetchSubmissionHistory: async (id: string): Promise<AssignmentSubmission[]> => {
    try {
      const response = await api.get<{ success: boolean; data: AssignmentSubmission[] }>(
        `/assignments/${id}/submissions`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch submission history');
      }

      // Parse date strings to Date objects
      const parsedData = response.data.data.map(submission => ({
        ...submission,
        submittedAt: new Date(submission.submittedAt),
      }));

      // Validate with Zod schema - filter out invalid items
      const validatedSubmissions = validateArrayPartial(
        AssignmentSubmissionSchema,
        parsedData,
        { context: 'assignmentApi.fetchSubmissionHistory', logErrors: true }
      );

      return validatedSubmissions;
    } catch (error) {
      handleApiError(error, {
        customMessage: 'Topshiriq tarixini yuklashda xatolik yuz berdi',
      });
      throw error;
    }
  },

  /**
   * Delete a submission
   * DELETE /submissions/{id}
   * 
   * @param id - Submission ID
   * @returns Promise<void>
   */
  deleteSubmission: async (id: string): Promise<void> => {
    try {
      const response = await api.delete<{ success: boolean; message?: string }>(
        `/submissions/${id}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete submission');
      }
    } catch (error) {
      handleApiError(error, {
        customMessage: 'Topshiriqni o\'chirishda xatolik yuz berdi',
      });
      throw error;
    }
  },
};
