// Attendance tracking data type definitions

export interface AttendanceRecord {
  id: string;
  courseId: string;
  courseName: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  reason?: string;
  checkInTime?: Date;
  checkOutTime?: Date;
}

export interface CourseAttendance {
  courseId: string;
  courseName: string;
  totalClasses: number;
  attended: number;
  percentage: number;
}

export interface AttendanceStats {
  totalClasses: number;
  attended: number;
  absent: number;
  late: number;
  excused: number;
  attendancePercentage: number;
  byCourse: CourseAttendance[];
}
