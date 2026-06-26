/**
 * API Services Index
 * Central export point for all API services
 */

export { dashboardApi } from './dashboard-api';
export type { NotificationSummary } from './dashboard-api';

export { assignmentApi } from './assignment-api';
export type {
  AssignmentSubmission,
  AssignmentFilters,
} from './assignment-api';

export { notificationApi } from './notification-api';
export type {
  NotificationCount,
  NotificationPaginationParams,
  PaginatedNotifications,
} from './notification-api';

export { attendanceApi } from './attendance-api';
export type {
  AttendanceFilters,
  AttendanceSummary,
} from './attendance-api';

export { scheduleApi } from './schedule-api';
export type {
  ScheduleFilters,
} from './schedule-api';

export { faceRecognitionApi } from './face-recognition-api';
export type {
  UploadFacePhotoPayload,
  FacePhotoResponse,
  VerifyFaceMatchPayload,
  FaceVerificationResponse,
} from './face-recognition-api';
