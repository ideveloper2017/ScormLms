import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Skeleton loading component for test cards
 * Matches the layout of actual test card components with title, course, metadata, and button
 */
export function TestCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            {/* Icon */}
            <Skeleton className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
              {/* Test Title */}
              <Skeleton className="h-5 w-3/4" />
              {/* Course Name */}
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          {/* Status Badge */}
          <Skeleton className="h-6 w-20 shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Category and Difficulty Badges */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center space-y-1">
            <Skeleton className="h-5 w-8 mx-auto" />
            <Skeleton className="h-3 w-12 mx-auto" />
          </div>
          <div className="text-center space-y-1">
            <Skeleton className="h-5 w-12 mx-auto" />
            <Skeleton className="h-3 w-8 mx-auto" />
          </div>
          <div className="text-center space-y-1">
            <Skeleton className="h-5 w-10 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        </div>

        {/* Progress Bar (optional, shown for some tests) */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>

        {/* Action Button */}
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Multiple test cards skeleton for grid views
 */
export function TestCardSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <TestCardSkeleton key={i} />
      ))}
    </div>
  );
}
