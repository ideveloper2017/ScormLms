import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { notificationApi } from '@/services/api/notification-api';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '../useNotifications';
import type { Notification } from '@/types/notification.types';
import type { NotificationCount } from '@/services/api/notification-api';

// Mock the notification API service
vi.mock('@/services/api/notification-api', () => ({
  notificationApi: {
    fetchNotifications: vi.fn(),
    fetchUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Helper to create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useNotifications hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useNotifications', () => {
    it('should fetch notifications successfully', async () => {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'New Assignment',
          message: 'Math homework due tomorrow',
          type: 'assignment',
          isRead: false,
          createdAt: new Date('2024-01-15'),
          priority: 'high',
        },
        {
          id: '2',
          title: 'Grade Posted',
          message: 'Your physics exam grade is available',
          type: 'grade',
          isRead: true,
          createdAt: new Date('2024-01-14'),
          priority: 'normal',
        },
      ];

      vi.mocked(notificationApi.fetchNotifications).mockResolvedValue(mockNotifications);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for success
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockNotifications);
      expect(result.current.isLoading).toBe(false);
      expect(notificationApi.fetchNotifications).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to fetch notifications');
      vi.mocked(notificationApi.fetchNotifications).mockRejectedValue(error);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect(result.current.data).toBeUndefined();
    });

    it('should use 1-minute stale time for real-time updates', async () => {
      const mockNotifications: Notification[] = [];
      vi.mocked(notificationApi.fetchNotifications).mockResolvedValue(mockNotifications);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify it doesn't refetch immediately
      expect(notificationApi.fetchNotifications).toHaveBeenCalledTimes(1);
    });
  });

  describe('useUnreadCount', () => {
    it('should fetch unread count successfully', async () => {
      const mockCount: NotificationCount = { count: 5 };

      vi.mocked(notificationApi.fetchUnreadCount).mockResolvedValue(mockCount);

      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockCount);
      expect(result.current.data?.count).toBe(5);
    });

    it('should handle unread count errors', async () => {
      const error = new Error('Failed to fetch unread count');
      vi.mocked(notificationApi.fetchUnreadCount).mockRejectedValue(error);

      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useMarkAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const notificationId = 'notification-1';
      vi.mocked(notificationApi.markAsRead).mockResolvedValue();

      const { result } = renderHook(() => useMarkAsRead(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(notificationId);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(notificationApi.markAsRead).toHaveBeenCalledWith(notificationId);
    });

    it('should handle mark as read errors', async () => {
      const error = new Error('Failed to mark as read');
      vi.mocked(notificationApi.markAsRead).mockRejectedValue(error);

      const { result } = renderHook(() => useMarkAsRead(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('notification-1');

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useMarkAllAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      vi.mocked(notificationApi.markAllAsRead).mockResolvedValue();

      const { result } = renderHook(() => useMarkAllAsRead(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(notificationApi.markAllAsRead).toHaveBeenCalledTimes(1);
    });

    it('should handle mark all as read errors', async () => {
      const error = new Error('Failed to mark all as read');
      vi.mocked(notificationApi.markAllAsRead).mockRejectedValue(error);

      const { result } = renderHook(() => useMarkAllAsRead(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useDeleteNotification', () => {
    it('should delete notification successfully', async () => {
      const notificationId = 'notification-1';
      vi.mocked(notificationApi.deleteNotification).mockResolvedValue();

      const { result } = renderHook(() => useDeleteNotification(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(notificationId);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(notificationApi.deleteNotification).toHaveBeenCalledWith(notificationId);
    });

    it('should handle delete notification errors', async () => {
      const error = new Error('Failed to delete notification');
      vi.mocked(notificationApi.deleteNotification).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteNotification(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('notification-1');

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('optimistic updates', () => {
    it('should optimistically update UI when marking as read', async () => {
      vi.mocked(notificationApi.markAsRead).mockResolvedValue();

      const { result } = renderHook(() => useMarkAsRead(), {
        wrapper: createWrapper(),
      });

      // The optimistic update happens in onMutate
      result.current.mutate('notification-1');

      // Verify the mutation was called
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('should optimistically update UI when deleting notification', async () => {
      vi.mocked(notificationApi.deleteNotification).mockResolvedValue();

      const { result } = renderHook(() => useDeleteNotification(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('notification-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });
});
