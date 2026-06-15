export const qk = {
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
};