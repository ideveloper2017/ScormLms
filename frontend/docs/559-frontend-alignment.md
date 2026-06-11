# 559-son qaror bo'yicha frontend moslashtirish tahlili

Manba: `/Users/ideveloper/Downloads/559 03.10.2022.doc`

Ushbu hujjat Vazirlar Mahkamasining 2022-yil 3-oktabrdagi 559-son qaroridagi masofaviy ta'lim LMS talablari bilan hozirgi frontend holatini solishtiradi va frontend ishlarini moslashtirilgan qismlarga ajratadi.

## 1. Normativ talablarning frontendga tarjimasi

| Qarordagi talab | Frontend moduli | Mavjud ekran/fayl | Holat | Keyingi ish |
|---|---|---|---|---|
| LMS platformasi bo'lishi | Core layout, auth, role navigation | `src/App.tsx`, `src/components/layout/*` | Asosiy routing va role navigation ulandi | Backend permissionlarga asoslangan menyu va protected route polish qilish |
| SCORM standartlariga moslik | Kurslar, SCORM player, SCORM sozlamalari | `src/pages/courses.tsx`, `src/components/scorm/course-player.tsx`, `src/pages/settings.tsx` | UI mavjud, tracking mock | SCORM package upload, manifest parse status, runtime tracking API bilan ulash |
| Avtoproktoring tizimi | Imtihonlar, proctoring session, face check | `src/pages/exams.tsx`, `src/components/proctoring/proctoring-session.tsx`, `src/components/auth/face-recognition.tsx` | UI mavjud, ayrim monitoring mock | Camera/mic/screen status, violation report, backend `/auth/face/*` va exam session API bilan ulash |
| Axborot-resurslari komponenti | Resurslar katalogi | `src/pages/resources.tsx` | UI mavjud | Resource CRUD, file preview/download, category/search API |
| Boshqarish komponenti | User, role, permission boshqaruvi | `src/pages/user-management.tsx`, `src/lib/rbac-api.ts` | Real API'ga ulandi: user list/create/delete, rol biriktirish, rol/huquq CRUD, permission-based UI guard | Backend'ga revoke endpointlari qo'shilganda (roldan huquq uzish, userdan rol olish) UI'ga ulash |
| Davomat va o'zlashtirish | Attendance/progress dashboard | `src/pages/attendance-progress.tsx` | UI mavjud | Progress, attendance, course usage endpointlari kerak |
| Kommunikatsiya | Forum, chat, xabar, email, videokonferensiya | `src/pages/communication.tsx` | UI mavjud | Forum/chat/message API kontrakti, live class endpointlari |
| Kontingentni hisobga olish | Talaba/o'qituvchi/guruh reyestri | `src/pages/contingent-management.tsx` | UI mavjud | Student/employee/group API, search/filter, detail drawer |
| Kurslarni boshqarish | Content, video, SCORM, tests, assignments | `src/pages/courses.tsx` | UI mavjud | Course controller/service API, upload/import/export, assignment/test forms |
| O'qitishni boshqarish | Course transfer, credits, retake, schedule, webinars | `src/pages/teaching-management.tsx` | UI mavjud | Transfer/credit/retake/schedule API va status workflow |
| Statistika komponenti | Reports/statistics | `src/pages/statistics.tsx`, `src/pages/reports.tsx` | UI mavjud | Aggregation API, export, archive filters |
| Talabalar bilimini nazorat qilish | Exams/test bank/proctoring | `src/pages/exams.tsx`, `src/components/proctoring/proctoring-session.tsx` | UI mavjud | Question bank, exam attempt, scoring, proctoring report API |
| Talabalarni identifikatsiya qilish | Auth + face verification | `src/contexts/auth-context.tsx`, `src/components/auth/face-recognition.tsx` | Login backendga moslandi, face UI bor | Face enroll/verify real upload, fallback policy, attempt audit |
| 1:50 o'qituvchi-talaba normativi | Course/instructor capacity validation | `src/pages/courses.tsx`, `src/pages/contingent-management.tsx` | Frontendda yo'q | Kursga biriktirishda capacity indicator va warning qo'shish |
| Yakuniy nazorat uchun shaxsan tashrif talabi | Exam schedule/compliance notice | `src/pages/exams.tsx`, `src/pages/student-dashboard.tsx` | Umumiy exam UI bor | Final exam type: `online`, `onsite`, `state_attestation`; onsite notice va schedule |
| Sifat monitoringi | Monitoring dashboard | `src/pages/statistics.tsx`, `src/pages/reports.tsx` | Qisman mavjud | Alohida monitoring tab: lesson/exam observation, survey, focus group, corrective actions |
| Davlat axborot tizimlari bilan integratsiya | Integration status/settings | `src/pages/settings.tsx`, backend HEMIS modules | Qisman HEMIS backend bor | HEMIS/davlat monitoring integration status, sync logs, error queue UI |
| Rasmiy veb-sahifa axborotlari | Public info/admin content | Hozir yo'q | Gap | Public page yoki admin content management kerak bo'lsa alohida modul |

## 2. Hozirgi frontendga moslashtirilgan modul chegaralari

### Core platform
- Auth, token refresh, logout, `/auth/me`.
- Role-based routing: `ROLE_ADMIN`, `ROLE_INSTRUCTOR`, `ROLE_STUDENT`.
- Layout: sidebar, header, theme, protected pages.
- Acceptance: build/lint o'tadi, login qilingan role bo'yicha menyu va dashboard ko'rinadi.

### Learning content
- Courses, SCORM package upload, course player, content library.
- Resources: books, documents, video lessons, presentations, external links.
- Acceptance: kurs list/create/edit, SCORM import status, lesson progress, resource download/preview.

### Student lifecycle
- Contingent: students, instructors, groups.
- Teaching management: transfer, credits, retake, schedule, consultation, webinar.
- Attendance/progress: individual learning plan, attendance, completion, grades.
- Acceptance: student profiledan kurs/progress/exam/history ko'rinadi.

### Assessment and proctoring
- Exams, question bank, attempts, scoring.
- Auto-proctoring: camera/mic/screen status, face verification, violation timeline, report.
- Acceptance: exam startdan oldin checks, exam davomida status panel, yakunda report.

### Communication
- Forum, chat, messages, email-like notifications, video conference.
- Feedback by course/instructor/system.
- Acceptance: course-scoped discussion, notifications, unread counts.

### Administration and compliance
- Users, roles, permissions, audit logs.
- Statistics, reports, monitoring, integrations.
- Compliance rules: 1:50 ratio, onsite final exam flag, monitoring corrective actions.
- Acceptance: admin dashboardda normativ risklar va integratsiya holati ko'rinadi.

## 3. Moslashtirilgan prioritet

1. **Build/Auth/Routing baseline** - bajarildi.
2. **Mavjud backend endpointlarini ulash** - auth, users, roles, permissions, face, 2FA, email, HEMIS.
3. **SCORM va course API kontrakti** - course controller, upload/import status, progress tracking.
4. **Exam/proctoring kontrakti** - question bank, attempts, violations, reports.
5. **Contingent/attendance/teaching API kontrakti** - student, instructor, group, progress, transfer, credit.
6. **Monitoring va compliance UI** - 1:50 ratio, onsite final exam, state integration logs, corrective actions.
7. **Mock datalarni bosqichma-bosqich API data bilan almashtirish** - har modulda loading/error/empty states bilan.

## 4. Backend bo'yicha kerakli API kontraktlar

Hozir backendda mavjud bo'lgan ulanishga tayyor endpointlar:
- `/api/v1/auth/login`, `/api/v1/auth/refresh-token`, `/api/v1/auth/me`, `/api/v1/auth/logout`
- `/api/v1/users`, `/api/v1/roles`, `/api/v1/permissions`
- `/auth/face/enroll`, `/auth/face/verify`
- `/api/v1/auth/2fa/*`
- `/auth/email/*`
- `/auth/hemis/login`

Frontenddagi quyidagi modullar uchun backend kontrakt hali to'liq ko'rinmadi:
- Courses/SCORM package and progress
- Exams/question bank/attempts/proctoring reports
- Resources/file library
- Communication/forum/chat/messages
- Attendance/progress/individual plans
- Contingent/groups/instructors/students
- Monitoring/integration logs/compliance checks

## 5. Definition of Done

Har bir modul frontend tomondan quyidagilar bilan yakunlangan hisoblanadi:
- real API service fayli mavjud;
- typed request/response modellari bor;
- list/detail/create/edit/delete yoki modulga mos action flow ishlaydi;
- loading, empty, error, permission denied holatlari bor;
- role-based route va action guard ishlaydi;
- `npm run build` va `npm run lint` o'tadi.
