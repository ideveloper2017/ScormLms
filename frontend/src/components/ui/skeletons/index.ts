/**
 * Skeleton Loading Components
 * 
 * Reusable skeleton components for displaying loading states throughout the Student Portal.
 * All components use the base Skeleton component from shadcn/ui with pulse animation.
 * 
 * Usage:
 * ```tsx
 * import { CourseCardSkeletonList } from '@/components/ui/skeletons';
 * 
 * function CoursesPage() {
 *   const { data, isLoading } = useCourses();
 *   
 *   if (isLoading) return <CourseCardSkeletonList />;
 *   return <CourseList courses={data} />;
 * }
 * ```
 */

// Course skeletons
export {
  CourseCardSkeleton,
  CourseCardSkeletonList,
} from './CourseCardSkeleton';

// Dashboard skeletons
export {
  StatCardSkeleton,
  DashboardStatsSkeleton,
  DashboardOverviewSkeleton,
} from './DashboardStatsSkeleton';

// Assignment skeletons
export {
  AssignmentItemSkeleton,
  AssignmentListSkeleton,
  AssignmentPageSkeleton,
} from './AssignmentListSkeleton';

// Table skeletons
export {
  TableSkeleton,
  GradeTableSkeleton,
  AttendanceTableSkeleton,
  CompactTableSkeleton,
} from './TableSkeleton';

// Test skeletons
export {
  TestCardSkeleton,
  TestCardSkeletonList,
} from './TestCardSkeleton';
