/**
 * React Query hooks for Notification management
 * 
 * Provides hooks for fetching notifications, marking as read, and deleting notifications.
 * All hooks use React Query for caching, loading states, and error handling with short staleTime
 * for real-time notification updates.
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import {
  notificationApi,
  type NotificationPaginationParams,
  type NotificationCount,
} from '@/services/api/notification-api';
import type { Notification } from '@/types/notification.types';
import { toast } from 'sonner';

/**
 * Hook to fetch all notifications for the authenticated student with optional pagination
 * Uses short staleTime for real-time updates
 * 
 * @param params - Optional pagination and filter parameters (page, pageSize, type)
 * @returns Query result with notifications array, loading state, and error state
 * 
 * @example
 * ```tsx
 * function NotificationsList() {
 *   const { data: notifications, isLoading, error } = useNotifications({ page: 1, pageSize: 20 });
 *   
 *   if (isLoading) return <ListSkeleton />;
 *   if (error) return <ErrorDisplay error={error} />;
 *   
 *   return (
 *     <div>
 *       {notifications?.map(notification => (
 *         <div key={notification.id}>
 *           <h3>{notification.title}</h3>
 *           <p>{notification.message}</p>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useNotifications = (params?: NotificationPaginationParams) => {
  return useQuery<Notification[], Error>({
    queryKey: qk.notifications.list(),
    queryFn: () => notificationApi.fetchNotifications(params),
    staleTime: 1 * 60 * 1000, // 1 minute - notifications need frequent updates
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to fetch the count of unread notifications
 * Uses short staleTime for real-time updates
 * 
 * @returns Query result with unread count number
 * 
 * @example
 * ```tsx
 * function NotificationBadge() {
 *   const { data: unreadData, isLoading } = useUnreadCount();
 *   
 *   if (isLoading) return null;
 *   
 *   return (
 *     <Badge variant="destructive">
 *       {unreadData?.count || 0}
 *     </Badge>
 *   );
 * }
 * ```
 */
export const useUnreadCount = () => {
  return useQuery<NotificationCount, Error>({
    queryKey: qk.notifications.count(),
    queryFn: notificationApi.fetchUnreadCount,
    staleTime: 1 * 60 * 1000, // 1 minute - real-time unread count
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to mark a specific notification as read
 * Implements optimistic updates for better UX
 * Invalidates notification cache on success
 * 
 * @returns Mutation result with markAsRead function, loading, and error states
 * 
 * @example
 * ```tsx
 * function NotificationItem({ notification }: { notification: Notification }) {
 *   const markAsRead = useMarkAsRead();
 *   
 *   const handleClick = () => {
 *     if (!notification.isRead) {
 *       markAsRead.mutate(notification.id);
 *     }
 *   };
 *   
 *   return (
 *     <div onClick={handleClick} className={notification.isRead ? 'opacity-50' : 'font-bold'}>
 *       {notification.title}
 *     </div>
 *   );
 * }
 * ```
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),

    // Optimistic update - update UI before server confirms
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: qk.notifications.list() });
      await queryClient.cancelQueries({ queryKey: qk.notifications.count() });

      // Snapshot previous values for rollback
      const previousNotifications = queryClient.getQueryData<Notification[]>(
        qk.notifications.list()
      );
      const previousCount = queryClient.getQueryData<NotificationCount>(
        qk.notifications.count()
      );

      // Optimistically update notification to read
      queryClient.setQueryData<Notification[]>(qk.notifications.list(), (old) => {
        if (!old) return old;
        return old.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification
        );
      });

      // Optimistically decrement unread count
      queryClient.setQueryData<NotificationCount>(qk.notifications.count(), (old) => {
        if (!old) return old;
        return { count: Math.max(0, old.count - 1) };
      });

      return { previousNotifications, previousCount };
    },

    // On success, invalidate queries to refetch fresh data
    onSuccess: () => {
      // Don't show toast for mark as read to avoid noise
      queryClient.invalidateQueries({ queryKey: qk.notifications.list() });
      queryClient.invalidateQueries({ queryKey: qk.notifications.count() });
    },

    // On error, rollback the optimistic update
    onError: (error, _id, context) => {
      // Rollback to previous state
      if (context?.previousNotifications) {
        queryClient.setQueryData(qk.notifications.list(), context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(qk.notifications.count(), context.previousCount);
      }

      toast.error('Xabarni o\'qilgan deb belgilashda xatolik', {
        description: error instanceof Error ? error.message : 'Qaytadan urinib ko\'ring',
      });
    },

    // Always refetch after mutation settles
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications.list() });
      queryClient.invalidateQueries({ queryKey: qk.notifications.count() });
    },
  });
};

/**
 * Hook to mark all notifications as read
 * Invalidates all notification-related queries on success
 * 
 * @returns Mutation result with markAllAsRead function, loading, and error states
 * 
 * @example
 * ```tsx
 * function MarkAllReadButton() {
 *   const markAllAsRead = useMarkAllAsRead();
 *   
 *   return (
 *     <Button
 *       onClick={() => markAllAsRead.mutate()}
 *       disabled={markAllAsRead.isPending}
 *     >
 *       {markAllAsRead.isPending ? 'Yuklanmoqda...' : 'Barchasini o\'qilgan deb belgilash'}
 *     </Button>
 *   );
 * }
 * ```
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),

    // Optimistic update - mark all as read immediately
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: qk.notifications.list() });
      await queryClient.cancelQueries({ queryKey: qk.notifications.count() });

      // Snapshot previous values for rollback
      const previousNotifications = queryClient.getQueryData<Notification[]>(
        qk.notifications.list()
      );
      const previousCount = queryClient.getQueryData<NotificationCount>(
        qk.notifications.count()
      );

      // Optimistically mark all notifications as read
      queryClient.setQueryData<Notification[]>(qk.notifications.list(), (old) => {
        if (!old) return old;
        return old.map((notification) => ({ ...notification, isRead: true }));
      });

      // Optimistically set unread count to 0
      queryClient.setQueryData<NotificationCount>(qk.notifications.count(), { count: 0 });

      return { previousNotifications, previousCount };
    },

    // On success, show toast and invalidate queries
    onSuccess: () => {
      toast.success('Barcha xabarlar o\'qilgan deb belgilandi', {
        description: 'Xabarlar ro\'yxati yangilandi',
      });

      queryClient.invalidateQueries({ queryKey: qk.notifications.list() });
      queryClient.invalidateQueries({ queryKey: qk.notifications.count() });
    },

    // On error, rollback the optimistic update
    onError: (error, _variables, context) => {
      // Rollback to previous state
      if (context?.previousNotifications) {
        queryClient.setQueryData(qk.notifications.list(), context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(qk.notifications.count(), context.previousCount);
      }

      toast.error('Xabarlarni o\'qilgan deb belgilashda xatolik', {
        description: error instanceof Error ? error.message : 'Qaytadan urinib ko\'ring',
      });
    },

    // Always refetch after mutation settles
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications.list() });
      queryClient.invalidateQueries({ queryKey: qk.notifications.count() });
    },
  });
};

/**
 * Hook to delete a specific notification
 * Handles cache invalidation after deletion
 * 
 * @returns Mutation result with deleteNotification function, loading, and error states
 * 
 * @example
 * ```tsx
 * function DeleteNotificationButton({ notificationId }: { notificationId: string }) {
 *   const deleteNotification = useDeleteNotification();
 *   
 *   return (
 *     <Button
 *       variant="destructive"
 *       onClick={() => deleteNotification.mutate(notificationId)}
 *       disabled={deleteNotification.isPending}
 *     >
 *       O'chirish
 *     </Button>
 *   );
 * }
 * ```
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationApi.deleteNotification(id),

    // Optimistic update - remove notification immediately
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: qk.notifications.list() });
      await queryClient.cancelQueries({ queryKey: qk.notifications.count() });

      // Snapshot previous values for rollback
      const previousNotifications = queryClient.getQueryData<Notification[]>(
        qk.notifications.list()
      );
      const previousCount = queryClient.getQueryData<NotificationCount>(
        qk.notifications.count()
      );

      // Find the notification being deleted to check if it's unread
      const deletedNotification = previousNotifications?.find((n) => n.id === id);
      const wasUnread = deletedNotification && !deletedNotification.isRead;

      // Optimistically remove notification from list
      queryClient.setQueryData<Notification[]>(qk.notifications.list(), (old) => {
        if (!old) return old;
        return old.filter((notification) => notification.id !== id);
      });

      // Optimistically update unread count if notification was unread
      if (wasUnread) {
        queryClient.setQueryData<NotificationCount>(qk.notifications.count(), (old) => {
          if (!old) return old;
          return { count: Math.max(0, old.count - 1) };
        });
      }

      return { previousNotifications, previousCount };
    },

    // On success, show toast and invalidate queries
    onSuccess: () => {
      toast.success('Xabar o\'chirildi', {
        description: 'Xabar muvaffaqiyatli o\'chirildi',
      });

      queryClient.invalidateQueries({ queryKey: qk.notifications.list() });
      queryClient.invalidateQueries({ queryKey: qk.notifications.count() });
    },

    // On error, rollback the optimistic update
    onError: (error, _id, context) => {
      // Rollback to previous state
      if (context?.previousNotifications) {
        queryClient.setQueryData(qk.notifications.list(), context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(qk.notifications.count(), context.previousCount);
      }

      toast.error('Xabarni o\'chirishda xatolik yuz berdi', {
        description: error instanceof Error ? error.message : 'Qaytadan urinib ko\'ring',
      });
    },

    // Always refetch after mutation settles
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications.list() });
      queryClient.invalidateQueries({ queryKey: qk.notifications.count() });
    },
  });
};

/**
 * Hook for infinite scroll notifications list
 * Implements AC 15.10 - infinite scroll for lists exceeding 100 items
 * 
 * This hook uses React Query's useInfiniteQuery to implement paginated infinite scroll.
 * Automatically loads next page when user scrolls to the bottom.
 * 
 * @param pageSize - Number of notifications per page (default: 20)
 * @returns Infinite query result with pages of notifications, hasNextPage, fetchNextPage, etc.
 * 
 * @example
 * ```tsx
 * function InfiniteNotificationsList() {
 *   const {
 *     data,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteNotifications();
 * 
 *   // Implement infinite scroll using Intersection Observer or onScroll
 *   const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
 *     const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight;
 *     if (bottom && hasNextPage && !isFetchingNextPage) {
 *       fetchNextPage();
 *     }
 *   };
 * 
 *   if (isLoading) return <ListSkeleton />;
 * 
 *   return (
 *     <div onScroll={handleScroll} className="overflow-auto">
 *       {data?.pages.map((page, i) => (
 *         <React.Fragment key={i}>
 *           {page.items.map((notification) => (
 *             <NotificationItem key={notification.id} notification={notification} />
 *           ))}
 *         </React.Fragment>
 *       ))}
 *       {isFetchingNextPage && <div>Yuklanmoqda...</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export const useInfiniteNotifications = (pageSize: number = 20) => {
  return useInfiniteQuery({
    queryKey: [...qk.notifications.list(), 'infinite', pageSize],
    queryFn: ({ pageParam = 1 }) =>
      notificationApi.fetchNotifications({ page: pageParam, pageSize }),
    getNextPageParam: (lastPage, allPages) => {
      // Check if there are more pages to load
      // Assuming the API returns total count or we can detect end of data
      const totalItems = allPages.reduce((sum, page) => sum + page.length, 0);
      
      // If last page has fewer items than pageSize, we've reached the end
      if (lastPage.length < pageSize) {
        return undefined; // No more pages
      }
      
      // Return next page number
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 1 * 60 * 1000, // 1 minute - notifications need frequent updates
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
};
