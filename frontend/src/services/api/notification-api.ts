import api from '@/lib/api';
import { handleApiError } from '@/utils/error-handler';
import { Notification } from '@/types/notification.types';
import { ApiResponse } from '@/lib/api';
import {
  NotificationSchema,
  NotificationCountSchema,
} from '@/types/schemas/notification.schema';
import { validateArrayPartial, validateDataOrFallback } from '@/utils/validation';

/**
 * Notification count response type
 */
export interface NotificationCount {
  count: number;
}

/**
 * Pagination parameters for notification fetching
 */
export interface NotificationPaginationParams {
  page?: number;
  pageSize?: number;
  type?: Notification['type'];
}

/**
 * Paginated notification response
 */
export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Notification API service for student notification operations
 * Handles notification viewing, marking as read, and managing notification state
 */
export const notificationApi = {
  /**
   * Fetches all notifications for the authenticated student with optional pagination
   * 
   * @param params - Optional pagination and filter parameters
   * @returns Promise resolving to array of notifications
   * 
   * @example
   * ```typescript
   * const notifications = await notificationApi.fetchNotifications({ page: 1, pageSize: 20 });
   * ```
   */
  fetchNotifications: async (
    params?: NotificationPaginationParams
  ): Promise<Notification[]> => {
    try {
      const response = await api.get<ApiResponse<Notification[]>>(
        '/students/me/notifications',
        {
          params,
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch notifications');
      }

      // Transform date strings to Date objects
      const parsedData = response.data.data.map((notification) => ({
        ...notification,
        createdAt: new Date(notification.createdAt),
      }));

      // Validate array with element-level filtering (Requirement 14.4)
      const validatedNotifications = validateArrayPartial(
        NotificationSchema,
        parsedData,
        { context: 'notificationApi.fetchNotifications', logErrors: true }
      );

      return validatedNotifications;
    } catch (error) {
      handleApiError(error, {
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },

  /**
   * Fetches the count of unread notifications for the authenticated student
   * 
   * @returns Promise resolving to unread notification count
   * 
   * @example
   * ```typescript
   * const { count } = await notificationApi.fetchUnreadCount();
   * console.log(`You have ${count} unread notifications`);
   * ```
   */
  fetchUnreadCount: async (): Promise<NotificationCount> => {
    try {
      const response = await api.get<ApiResponse<NotificationCount>>(
        '/students/me/notifications/unread/count'
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch unread count');
      }

      // Validate with Zod schema
      const validatedCount = validateDataOrFallback(
        NotificationCountSchema,
        response.data.data,
        { count: 0 },
        { context: 'notificationApi.fetchUnreadCount', logErrors: true }
      );

      return validatedCount;
    } catch (error) {
      handleApiError(error, {
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },

  /**
   * Marks a specific notification as read
   * 
   * @param id - The notification ID
   * @returns Promise resolving when the operation completes
   * 
   * @example
   * ```typescript
   * await notificationApi.markAsRead('notification-123');
   * ```
   */
  markAsRead: async (id: string): Promise<void> => {
    try {
      const response = await api.post<ApiResponse<void>>(
        `/notifications/${id}/read`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to mark notification as read');
      }
    } catch (error) {
      handleApiError(error, {
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },

  /**
   * Marks all notifications as read for the authenticated student
   * 
   * @returns Promise resolving when the operation completes
   * 
   * @example
   * ```typescript
   * await notificationApi.markAllAsRead();
   * ```
   */
  markAllAsRead: async (): Promise<void> => {
    try {
      const response = await api.post<ApiResponse<void>>(
        '/students/me/notifications/read-all'
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to mark all notifications as read');
      }
    } catch (error) {
      handleApiError(error, {
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },

  /**
   * Deletes a specific notification
   * 
   * @param id - The notification ID
   * @returns Promise resolving when the operation completes
   * 
   * @example
   * ```typescript
   * await notificationApi.deleteNotification('notification-123');
   * ```
   */
  deleteNotification: async (id: string): Promise<void> => {
    try {
      const response = await api.delete<ApiResponse<void>>(
        `/notifications/${id}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete notification');
      }
    } catch (error) {
      handleApiError(error, {
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },
};
