// Class schedule data type definitions

export interface ScheduleItem {
  id: string;
  courseId: string;
  courseName: string;
  instructor: string;
  room: string;
  building?: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  type: 'lecture' | 'lab' | 'seminar' | 'tutorial';
  color?: string; // For UI color coding
  isOnline: boolean;
  meetingLink?: string;
  title?: string;
  description?: string;
  date?: string;
  startsAt?: string;
  endsAt?: string;
  format?: 'synchronous' | 'asynchronous';
  status?: 'published' | 'completed';
  recordingUrl?: string;
  resourceUrl?: string;
  hasRecording?: boolean;
  hasResource?: boolean;
  canJoin?: boolean;
  canOpenResources?: boolean;
  accessed?: boolean;
}

export type ScheduleAccessType = 'LIVE_JOIN' | 'RECORDING_OPEN' | 'RESOURCE_OPEN';

export interface ScheduleAccessResponse {
  url: string;
  type: string;
  occurredAt: string;
}

export interface WeeklySchedule {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  items: ScheduleItem[];
}
