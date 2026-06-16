/**
 * Assignment React Query Hooks
 * 
 * This module provides React Query hooks for managing assignment data,
 * including fetching assignments, submitting assignments with file uploads,
 * viewing submission history, and deleting submissions.
 * 
 * All hooks implement:
 * - Automatic caching (2 minutes stale time)
 * - Error handling with toast notifications
 * - Optimistic updates for better UX
 * - Cache invalidation on mutations
 */

export {
  useAssignments,
  usePaginatedAssignments,
  useAssignment,
  useSubmitAssignment,
  useSubmissionHistory,
  useDeleteSubmission,
} from './useAssignments';
