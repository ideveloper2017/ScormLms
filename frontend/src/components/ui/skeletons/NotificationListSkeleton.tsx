import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Skeleton for a single notification list item
 */
export function NotificationItemSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        {/* Icon */}
        <Skeleton className="h-8 w-8 rounded-lg shrink-0 mt-0.5" />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title and time row */}
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-20 shrink-0" />
          </div>
          
          {/* Message */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          
          {/* Badges */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loading component for notification lists
 * Displays a vertical list of notification items
 */
export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <NotificationItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for notification page with header and filters
 */
export function NotificationPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-md shrink-0" />
        ))}
      </div>

      {/* Notification list */}
      <NotificationListSkeleton count={8} />
    </div>
  );
}
