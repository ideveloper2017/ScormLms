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
};