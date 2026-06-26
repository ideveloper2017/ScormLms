import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/**
 * Skeleton loading component for course cards
 * Matches the layout of actual course card components with image, title, instructor, and metadata
 */
export function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Course Image */}
      <Skeleton className="h-48 w-full rounded-t-lg rounded-b-none" />
      
      <div className="p-6 space-y-4">
        {/* Course Title */}
        <Skeleton className="h-6 w-3/4" />
        
        {/* Instructor */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        
        {/* Metadata Row */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Multiple course cards skeleton for list views
 */
export function CourseCardSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}
