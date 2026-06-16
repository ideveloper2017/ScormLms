import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { assignmentApi, type AssignmentFilters } from '@/services/api/assignment-api';
import type {
  Assignment,
  AssignmentDetails,
  SubmitAssignmentPayload,
  AssignmentSubmission,
} from '@/types/assignment.types';
import { toast } from 'sonner';

/**
 * Hook to fetch all assignments with optional filters
 * Uses React Query for caching and automatic refetching
 * 
 * @param filters - Optional filters (status, courseId, priority)
 * @returns Query result with assignments data, loading, and error states
 */
export const useAssignments = (filters?: AssignmentFilters) => {
  return useQuery({
    queryKey: qk.assignments.list(),
    queryFn: () => assignmentApi.fetchAssignments(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  });
};

/**
 * Hook to fetch assignments with pagination
 * Implements AC 15.9 - pagination for large datasets (>50 records)
 * 
 * This hook provides paginated assignment fetching with keepPreviousData
 * to prevent loading states between page transitions.
 * 
 * @param page - Current page number (1-based)
 * @param pageSize - Number of assignments per page (default: 20)
 * @param filters - Optional filters (status, courseId, priority)
 * @returns Query result with paginated assignments data
 * 
 * @example
 * ```tsx
 * function PaginatedAssignmentsList() {
 *   const [page, setPage] = useState(1);
 *   const { data, isLoading, isPlaceholderData } = usePaginatedAssignments(page, 20);
 *   
 *   return (
 *     <div>
 *       {data?.items.map(assignment => (
 *         <AssignmentCard key={assignment.id} assignment={assignment} />
 *       ))}
 *       <Pagination
 *         currentPage={page}
 *         totalPages={Math.ceil((data?.total || 0) / 20)}
 *         onPageChange={setPage}
 *         disabled={isPlaceholderData}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export const usePaginatedAssignments = (
  page: number = 1,
  pageSize: number = 20,
  filters?: AssignmentFilters
) => {
  return useQuery({
    queryKey: [...qk.assignments.list(), 'paginated', page, pageSize, filters],
    queryFn: () => assignmentApi.fetchAssignments({ ...filters, page, pageSize }),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a single assignment by ID
 * Uses React Query for caching
 * 
 * @param id - Assignment ID
 * @returns Query result with assignment details, loading, and error states
 */
export const useAssignment = (id: string) => {
  return useQuery({
    queryKey: qk.assignments.detail(id),
    queryFn: () => assignmentApi.fetchAssignmentById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to submit an assignment
 * Implements optimistic updates for better UX
 * Handles file uploads with FormData
 * 
 * @returns Mutation result with submit function, loading, and error states
 */
export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SubmitAssignmentPayload }) =>
      assignmentApi.submitAssignment(id, payload),
    
    // Optimistic update - update UI before server confirms
    onMutate: async ({ id }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: qk.assignments.list() });
      
      // Snapshot the previous value for rollback
      const previousAssignments = queryClient.getQueryData<Assignment[]>(qk.assignments.list());
      
      // Optimistically update the assignment status
      queryClient.setQueryData<Assignment[]>(qk.assignments.list(), (old) => {
        if (!old) return old;
        return old.map(assignment =>
          assignment.id === id
            ? { ...assignment, status: 'submitted' as const, submittedAt: new Date() }
            : assignment
        );
      });
      
      // Also update the detail cache if it exists
      const previousDetail = queryClient.getQueryData<AssignmentDetails>(qk.assignments.detail(id));
      if (previousDetail) {
        queryClient.setQueryData<AssignmentDetails>(qk.assignments.detail(id), {
          ...previousDetail,
          status: 'submitted',
          submittedAt: new Date(),
        });
      }
      
      // Return context for rollback
      return { previousAssignments, previousDetail };
    },
    
    // On success, show toast and invalidate queries
    onSuccess: (_data, { id }) => {
      toast.success('Topshiriq muvaffaqiyatli topshirildi', {
        description: 'Topshiriq o\'qituvchiga yuborildi',
      });
      
      // Invalidate to trigger refetch with server data
      queryClient.invalidateQueries({ queryKey: qk.assignments.list() });
      queryClient.invalidateQueries({ queryKey: qk.assignments.detail(id) });
      queryClient.invalidateQueries({ queryKey: qk.dashboard.stats() });
    },
    
    // On error, rollback the optimistic update
    onError: (error, { id }, context) => {
      // Rollback to previous state
      if (context?.previousAssignments) {
        queryClient.setQueryData(qk.assignments.list(), context.previousAssignments);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(qk.assignments.detail(id), context.previousDetail);
      }
      
      toast.error('Topshiriqni topshirishda xatolik yuz berdi', {
        description: error instanceof Error ? error.message : 'Qaytadan urinib ko\'ring',
      });
    },
    
    // Always refetch after mutation settles
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.assignments.list() });
    },
  });
};

/**
 * Hook to fetch submission history for an assignment
 * 
 * @param assignmentId - Assignment ID
 * @returns Query result with submission history, loading, and error states
 */
export const useSubmissionHistory = (assignmentId: string) => {
  return useQuery({
    queryKey: [...qk.assignments.detail(assignmentId), 'submissions'],
    queryFn: () => assignmentApi.fetchSubmissionHistory(assignmentId),
    enabled: !!assignmentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to delete a submission
 * Handles cache invalidation after deletion
 * 
 * @returns Mutation result with delete function, loading, and error states
 */
export const useDeleteSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: string) => assignmentApi.deleteSubmission(submissionId),
    
    onSuccess: () => {
      toast.success('Topshiriq o\'chirildi', {
        description: 'Topshiriq muvaffaqiyatli o\'chirildi',
      });
      
      // Invalidate all assignment-related queries
      queryClient.invalidateQueries({ queryKey: qk.assignments.root() });
      queryClient.invalidateQueries({ queryKey: qk.dashboard.stats() });
    },
    
    onError: (error) => {
      toast.error('Topshiriqni o\'chirishda xatolik yuz berdi', {
        description: error instanceof Error ? error.message : 'Qaytadan urinib ko\'ring',
      });
    },
  });
};
