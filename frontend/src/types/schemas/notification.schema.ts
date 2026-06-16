import { z } from 'zod';

/**
 * Zod schema for Notification data validation
 * Validates API responses to ensure type safety at runtime
 */
export const NotificationSchema = z.object({
  id: z.string().min(1, 'Notification ID is required'),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['course', 'assignment', 'test', 'grade', 'attendance', 'system']),
  isRead: z.boolean(),
  createdAt: z.coerce.date(),
  relatedId: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  actionUrl: z.string().optional(),
});

export const NotificationGroupSchema = z.object({
  type: z.enum(['course', 'assignment', 'test', 'grade', 'attendance', 'system']),
  notifications: z.array(NotificationSchema),
  unreadCount: z.number().min(0),
});

export const NotificationCountSchema = z.object({
  count: z.number().min(0),
});

// Array schemas for filtering validation
export const NotificationsArraySchema = z.array(NotificationSchema);
