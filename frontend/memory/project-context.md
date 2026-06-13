---
name: project-context
description: ScormLMS frontend structure — admin routes, sidebar navigation, page mapping
metadata:
  type: project
---

ScormLMS: Kotlin Spring Boot backend + React/Vite/TypeScript frontend.

Talaba menyusi `/student/*` yo'llarida:
- /student/dashboard → StudentDashboard
- /student/courses → Courses (Mening kurslarim)
- /student/schedule → StudentSchedule (haftalik jadval, rang-li dars kartalari)
- /student/assignments → StudentAssignments (topshiriqlar, muddat, status, yuklash)
- /student/tests → StudentTests (testlar, urinish soni, eng yuqori natija)
- /student/exams → Exams
- /student/grades → StudentGrades (list + bar chart + radar chart, GPA)
- /student/attendance → StudentAttendance (% per fan, davomat ogohlantirishi)
- /student/messages → Communication
- /student/notifications → StudentNotifications (filter by type, mark read)
- /student/calendar → AdminCalendar (talaba uchun ham ishlaydi)
- /student/profile → StudentCabinet



Admin menyu `/admin/*` yo'llarida:
- /admin/dashboard → AdminDashboard (7 metrik: talabalar, o'qituvchilar, faol kurslar, faol testlar, harakatlar, kontent %, o'zlashtirish)
- /admin/users → UserManagement (CRUD, import, audit, roles matrix)
- /admin/students → StudentManagement
- /admin/teachers → TeacherManagement
- /admin/roles → AdminRoles (ruxsatlar matritsasi, rol statistikasi)
- /admin/faculties|departments|programs → AcademicStructure (defaultTab prop)
- /admin/groups → Groups
- /admin/subjects → Subjects
- /admin/study-plans → AdminStudyPlans (placeholder CRUD)
- /admin/courses → Courses
- /admin/calendar → AdminCalendar (akademik sana/tadbirlar)
- /admin/reports → Reports
- /admin/integrations → AdminIntegrations (SCORM, LDAP, SMTP, LTI, Zoom)
- /admin/audit-logs → AdminAuditLogs (filter + jadval)
- /admin/settings → Settings

Sidebar: `app-sidebar.tsx` — ADMIN/SUPER_ADMIN uchun to'liq admin nav, METODIST uchun qisqartirilgan.
Eski yo'llar (`/management`, `/academic`, `/groups` va boshqalar) hali ham ishlaydi.

**Why:** /admin/* yo'llari toza URL tuzilmasi va ruxsat boshqaruvini osonlashtiradi.