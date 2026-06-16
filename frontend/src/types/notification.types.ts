// Notification data type definitions

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'course' | 'assignment' | 'test' | 'grade' | 'attendance' | 'system';
  isRead: boolean;
  createdAt: Date;
  relatedId?: string; // courseId, assignmentId, etc.
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
}

export interface NotificationGroup {
  type: Notification['type'];
  notifications: Notification[];
  unreadCount: number;
}

export interface NotificationCount {
  count: number;
}
