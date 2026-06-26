import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/**
 * Skeleton for individual stat card
 */
export function StatCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between space-x-4">
        <div className="space-y-2 flex-1">
          {/* Label */}
          <Skeleton className="h-3 w-24" />
          {/* Value */}
          <Skeleton className="h-8 w-16" />
          {/* Change indicator */}
          <Skeleton className="h-3 w-20" />
        </div>
        {/* Icon */}
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
    </Card>
  );
}

/**
 * Skeleton loading component for dashboard statistics section
 * Displays multiple stat cards in a grid layout
 */
export function DashboardStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Full dashboard skeleton including profile header and stats
 */
export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header with student profile */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2 flex-1">
            {/* Student name */}
            <Skeleton className="h-6 w-48" />
            {/* Student ID */}
            <Skeleton className="h-4 w-32" />
          </div>
          {/* Action button */}
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </Card>

      {/* Stats Grid */}
      <DashboardStatsSkeleton count={4} />

      {/* Recent Activity Section */}
      <Card className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
