import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/**
 * Skeleton for a single assignment list item
 */
export function AssignmentItemSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Assignment Title */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-64" />
          </div>
          
          {/* Course Name */}
          <Skeleton className="h-4 w-40" />
          
          {/* Metadata row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {/* Status badge */}
          <Skeleton className="h-6 w-20 rounded-full" />
          {/* Priority badge */}
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Skeleton loading component for assignment lists
 * Displays a vertical list of assignment items
 */
export function AssignmentListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <AssignmentItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for assignment list with filters and header
 */
export function AssignmentPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>

      {/* Assignment list */}
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <AssignmentListSkeleton count={6} />
      </div>
    </div>
  );
}
