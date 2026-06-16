/**
 * Notification React Query Hooks
 * 
 * This module provides React Query hooks for managing notification data,
 * including fetching notifications with pagination, marking notifications as read,
 * marking all as read, deleting notifications, and fetching unread count.
 * 
 * All hooks implement:
 * - Short stale time (1 minute) for real-time updates
 * - Automatic caching and background refetching
 * - Error handling with toast notifications (in Uzbek)
 * - Optimistic updates for better UX
 * - Cache invalidation on mutations
 * 
 * @example
 * ```tsx
 * import { useNotifications, useMarkAsRead, useUnreadCount } from '@/hooks/notifications';
 * 
 * function NotificationsPage() {
 *   const { data: notifications, isLoading } = useNotifications();
 *   const { data: unreadData } = useUnreadCount();
 *   const markAsRead = useMarkAsRead();
 *   
 *   if (isLoading) return <ListSkeleton />;
 *   
 *   return (
 *     <div>
 *       <h1>Xabarlar ({unreadData?.count || 0} o'qilmagan)</h1>
 *       {notifications?.map(notification => (
 *         <div key={notification.id} onClick={() => markAsRead.mutate(notification.id)}>
 *           {notification.title}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

export {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useInfiniteNotifications,
} from './useNotifications';
