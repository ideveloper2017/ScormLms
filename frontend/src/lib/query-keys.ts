import type { CourseFilters } from '@/types/course.types';

export const qk = {
  studentProfile: ()             => ['student', 'me']            as const,
  students:      ()              => ['students']                 as const,
  users:         ()              => ['users']                    as const,
  roles:         ()              => ['roles']                    as const,
  auditLogs:     ()              => ['audit-logs']               as const,
  userAuditLogs: (username: string) => ['audit-logs', 'user', username] as const,
  faculties:     ()              => ['faculties']                as const,
  departments:   ()              => ['departments']              as const,
  programs:      ()              => ['programs']                 as const,
  groups:        ()              => ['groups']                   as const,
  subjects:      ()              => ['subjects']                 as const,
  teachers:      ()              => ['teachers']                 as const,

  // Student portal query keys - hierarchical structure
  dashboard: {
    root: () => ['dashboard'] as const,
    data: () => [...qk.dashboard.root(), 'data'] as const,
    profile: () => [...qk.dashboard.root(), 'profile'] as const,
    stats: () => [...qk.dashboard.root(), 'stats'] as const,
  },

  courses: {
    root: () => ['courses'] as const,
    list: (filters?: CourseFilters) => [...qk.courses.root(), 'list', filters] as const,
    active: () => [...qk.courses.root(), 'active'] as const,
    detail: (id: string) => [...qk.courses.root(), 'detail', id] as const,
    progress: (courseId: string) => [...qk.courses.root(), 'progress', courseId] as const,
  },

  assignments: {
    root: () => ['assignments'] as const,
    list: () => [...qk.assignments.root(), 'list'] as const,
    pending: () => [...qk.assignments.root(), 'pending'] as const,
    detail: (id: string) => [...qk.assignments.root(), 'detail', id] as const,
  },

  tests: {
    root: () => ['tests'] as const,
    list: () => [...qk.tests.root(), 'list'] as const,
    upcoming: () => [...qk.tests.root(), 'upcoming'] as const,
    detail: (id: string) => [...qk.tests.root(), 'detail', id] as const,
  },

  grades: {
    root: () => ['grades'] as const,
    list: () => [...qk.grades.root(), 'list'] as const,
    byCourse: (courseId: string) => [...qk.grades.root(), 'byCourse', courseId] as const,
    gpa: () => [...qk.grades.root(), 'gpa'] as const,
    distribution: () => [...qk.grades.root(), 'distribution'] as const,
  },

  attendance: {
    root: () => ['attendance'] as const,
    list: () => [...qk.attendance.root(), 'list'] as const,
    byCourse: (courseId: string) => [...qk.attendance.root(), 'byCourse', courseId] as const,
    percentage: (courseId?: string) => [...qk.attendance.root(), 'percentage', courseId] as const,
    stats: () => [...qk.attendance.root(), 'stats'] as const,
  },

  schedule: {
    root: () => ['schedule'] as const,
    list: () => [...qk.schedule.root(), 'list'] as const,
    byWeek: (weekNumber: number) => [...qk.schedule.root(), 'byWeek', weekNumber] as const,
    upcoming: () => [...qk.schedule.root(), 'upcoming'] as const,
    today: () => [...qk.schedule.root(), 'today'] as const,
  },

  notifications: {
    root: () => ['notifications'] as const,
    list: () => [...qk.notifications.root(), 'list'] as const,
    unread: () => [...qk.notifications.root(), 'unread'] as const,
    count: () => [...qk.notifications.root(), 'count'] as const,
  },

  proctor: {
    root: () => ['proctor'] as const,
    stats: () => [...qk.proctor.root(), 'stats'] as const,
    activeExams: () => [...qk.proctor.root(), 'active-exams'] as const,
    violations: () => [...qk.proctor.root(), 'violations'] as const,
  },

  monitor: {
    root: () => ['monitor'] as const,
    stats: () => [...qk.monitor.root(), 'stats'] as const,
    alerts: () => [...qk.monitor.root(), 'alerts'] as const,
  },

  instructor: {
    root: () => ['instructor'] as const,
    stats: () => [...qk.instructor.root(), 'stats'] as const,
    courses: () => [...qk.instructor.root(), 'courses'] as const,
    submissions: () => [...qk.instructor.root(), 'submissions'] as const,
    todayLessons: () => [...qk.instructor.root(), 'today-lessons'] as const,
    weeklyActivity: () => [...qk.instructor.root(), 'weekly-activity'] as const,
  },

  teacher: {
    root: () => ['teacher'] as const,
    profile: () => [...qk.teacher.root(), 'profile'] as const,
    stats: () => [...qk.teacher.root(), 'stats'] as const,
    courses: () => [...qk.teacher.root(), 'courses'] as const,
    students: (courseId?: string) => [...qk.teacher.root(), 'students', courseId] as const,
    assignments: () => [...qk.teacher.root(), 'assignments'] as const,
    submissions: () => [...qk.teacher.root(), 'submissions'] as const,
    tests: () => [...qk.teacher.root(), 'tests'] as const,
    attendance: () => [...qk.teacher.root(), 'attendance'] as const,
    gradebook: (courseId: string) => [...qk.teacher.root(), 'gradebook', courseId] as const,
    todaySchedule: () => [...qk.teacher.root(), 'today-schedule'] as const,
  },

  exams: {
    root: () => ['exams'] as const,
    list: () => [...qk.exams.root(), 'list'] as const,
    results: () => [...qk.exams.root(), 'results'] as const,
    stats: () => [...qk.exams.root(), 'stats'] as const,
  },

  reports: {
    root: () => ['reports'] as const,
    list: () => [...qk.reports.root(), 'list'] as const,
    academic: () => [...qk.reports.root(), 'academic'] as const,
    monthly: () => [...qk.reports.root(), 'monthly'] as const,
    courses: () => [...qk.reports.root(), 'courses'] as const,
  },

  resources: {
    root: () => ['resources'] as const,
    list: (courseId?: string) => [...qk.resources.root(), 'list', courseId] as const,
    categories: () => [...qk.resources.root(), 'categories'] as const,
  },

  adminStats: {
    root: () => ['admin-stats'] as const,
    system: () => [...qk.adminStats.root(), 'system'] as const,
    users: () => [...qk.adminStats.root(), 'users'] as const,
    activity: () => [...qk.adminStats.root(), 'activity'] as const,
  },
};