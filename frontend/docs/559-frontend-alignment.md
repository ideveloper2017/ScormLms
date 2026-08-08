# 559-son qaror bo'yicha frontend moslashtirish tahlili

Manba: `C:\Users\Superadmin\Desktop\559-son qaror.pdf`

Ushbu hujjat Vazirlar Mahkamasining 2022-yil 3-oktabrdagi 559-son qaroridagi masofaviy ta'lim LMS talablari bilan hozirgi frontend holatini solishtiradi va frontend ishlarini moslashtirilgan qismlarga ajratadi.

## 1. Normativ talablarning frontendga tarjimasi

| Qarordagi talab | Frontend moduli | Mavjud ekran/fayl | Holat | Keyingi ish |
|---|---|---|---|---|
| LMS platformasi bo'lishi | Core layout, auth, role navigation | `src/App.tsx`, `src/components/layout/*` | Asosiy routing va role navigation ulandi | Backend permissionlarga asoslangan menyu va protected route polish qilish |
| 3-band kunduzgi dastur mavjudligi | Yo'nalishlar boshqaruvi | `src/pages/admin/programs.tsx`, `src/lib/academic-api.ts` | V43 UI AKTdan tashqari masofaviy dastur uchun kunduzgi shakl mavjudligi va buyruq/reyestr rekvizitini majburiy qiladi; legacy tasdiqsiz holat jadvalda ochiq ko'rinadi | Haqiqiy asos rekvizitini metodika bo'limi qabul datasetida tekshiradi |
| 8-band infratuzilma va rasmiy sayt tayyorgarligi | Hujjatli readiness reyestri | `src/pages/admin/distance-readiness.tsx`, `src/services/api/distance-readiness-api.ts`, `src/components/layout/app-sidebar.tsx` | Internet quvvati, kompyuter xona va sanitariya dalili, texnik shtat, server sig'imi/UZ/mulk yoki 5 yillik ijara, HTTPS rasmiy saytning to'rtta majburiy bo'limi, mustaqil verify/reject/archive va monitoring read-only real API bilan ishlaydi | Haqiqiy hujjatlar va sayt mazmunini `DEP-07` manual UATda komissiya tekshiradi |
| SCORM standartlariga moslik | Kurslar, SCORM player, SCORM sozlamalari | `src/pages/courses.tsx`, `src/components/scorm/course-player.tsx`, `src/pages/settings.tsx` | UI mavjud, tracking mock | SCORM package upload, manifest parse status, runtime tracking API bilan ulash |
| Avtoproktoring tizimi | Imtihonlar, proctoring session, biometrik governance | `src/components/proctoring/proctoring-session.tsx`, `src/pages/admin/biometric-governance.tsx`, `src/services/api/biometric-governance-api.ts` | Real API: siyosatsiz fail-closed, exact-hash rozilikdan oldin kamera yoqilmaydi, skip yo'q, yuz shabloni/retention/withdrawal va admin/monitoring RBAC ishlaydi | Universitet tasdiqlagan real siyosat va vendor/model bahosini manual UATda tasdiqlash |
| Axborot-resurslari komponenti | Resurslar katalogi | `src/pages/resources.tsx` | UI mavjud | Resource CRUD, file preview/download, category/search API |
| Boshqarish komponenti | User, role, permission boshqaruvi | `src/pages/user-management.tsx`, `src/lib/rbac-api.ts` | Real API'ga ulandi: user list/create/delete, rol biriktirish, rol/huquq CRUD, permission-based UI guard | Backend'ga revoke endpointlari qo'shilganda (roldan huquq uzish, userdan rol olish) UI'ga ulash |
| Davomat va o'zlashtirish | Attendance/progress dashboard | `src/pages/attendance-progress.tsx` | UI mavjud | Progress, attendance, course usage endpointlari kerak |
| Kommunikatsiya | Forum, chat, xabar, email, videokonferensiya | `src/pages/communication.tsx`, `src/pages/teacher/sessions.tsx`, `src/services/api/teacher-portal-api.ts` | Forum/chat/e'lon oqimlariga qo'shimcha V42 provider meetingni backend orqali yaratish/retry/cancel qilish, READY/FAILED holati, host/join linklari va publish gate'ini real UIga uladi; token brauzerga berilmaydi | `DEP-05` real provider sandboxi va email/push credentiallarini deployment UATda tekshirish |
| Kontingentni hisobga olish | Talaba/o'qituvchi/guruh reyestri | `src/pages/contingent-management.tsx` | UI mavjud | Student/employee/group API, search/filter, detail drawer |
| Talaba kartochkasi va o'qishga qabul | Shaxsiy ma'lumotni akademik biriktirishdan ajratish | `src/pages/student-management.tsx`, `src/lib/student-api.ts` | V56 ikki bosqichli real API: avval `REGISTERED` shaxsiy kartochka, keyin alohida dastur/guruh/kontrakt/buyruqli qabul | Registrar bilan ikki bosqichli UAT ko'rsatuvi |
| Kurslarni boshqarish | Content, video, SCORM, tests, assignments | `src/pages/courses.tsx` | UI mavjud | Course controller/service API, upload/import/export, assignment/test forms |
| O'qitishni boshqarish | Course transfer, credits, retake, schedule, webinars | `src/pages/teaching-management.tsx` | UI mavjud | Transfer/credit/retake/schedule API va status workflow |
| Statistika komponenti | Reports/statistics | `src/pages/statistics.tsx`, `src/pages/reports.tsx` | UI mavjud | Aggregation API, export, archive filters |
| Talabalar bilimini nazorat qilish | Exams/test bank/proctoring | `src/pages/exams.tsx`, `src/components/proctoring/proctoring-session.tsx` | UI mavjud | Question bank, exam attempt, scoring, proctoring report API |
| Talabalarni identifikatsiya qilish | Credential auth + proktorli attempt ichidagi face verification | `src/contexts/auth-context.tsx`, `src/components/proctoring/proctoring-session.tsx`, `src/components/auth/face-photo-setup.tsx` | Login biometrik ma'lumot yig'maydi va localStorage bypassi yo'q; yuz enroll/verify faqat amaldagi siyosat va rozilik bilan serverda bog'lanadi | Real kamera, accessibility va vendor/model acceptance ssenariysini UATda bajarish |
| 1:50 o'qituvchi-talaba normativi | Course/instructor capacity validation | `src/pages/courses.tsx`, `src/pages/contingent-management.tsx` | Frontendda yo'q | Kursga biriktirishda capacity indicator va warning qo'shish |
| Nodavlat OTM dasturining litsenziyada qayd etilishi (16-band) | Litsenziya reyestri va qamrov workflowi | `src/pages/admin/non-state-licenses.tsx`, `src/services/api/non-state-license-api.ts` | Real API, DRAFT/VERIFIED/REVOKED, validity, dastur scope'i, qidiruv va compliance route ishlaydi | Haqiqiy litsenziya/reyestr ma'lumotini yuridik bo'lim bilan manual UATda tekshirish |
| Ishlaydigan talabaning haq saqlanadigan ta'tili (22-band) | Ta'til dalili va student ko'rinishi | `src/pages/admin/assessment-leaves.tsx`, `src/pages/student/assessment-leave.tsx`, `src/services/api/assessment-leave-api.ts` | 15 kunlik validatsiya, maqsad/ish beruvchi/buyruq/haq saqlanishi, verify/reject va real API ishlaydi | Haqiqiy ish beruvchi buyrug'i va ish haqi saqlanishini HR manual UATda tekshiradi |
| Xorijiy pedagoglarni masofaviy darsga jalb qilish (25-band) | Engagement dalili va kurs bog'lanishi | `src/pages/admin/foreign-teacher-engagements.tsx`, `src/services/api/foreign-teacher-engagement-api.ts` | ISO davlat kodi, fuqarolik/malaka/shartnoma/buyruq, davr, masofaviy kurs tanlovi, verify/reject va real API ishlaydi | Haqiqiy HR hujjatlari yoki foydalanilmasa asoslangan NOT_APPLICABLE qarori manual UATda tekshiriladi |
| Buzilish uchun qonuniy javobgarlik (33-band) | Vakolatli organga yo'llanma va tashqi qaror reestri | `src/pages/admin/accountability-referrals.tsx`, `src/services/api/accountability-referral-api.ts` | Neytral subyekt rekviziti, compliance issue/dalil paketi, qoralama, mustaqil yo'llash, uch xil tashqi qaror natijasi, monitoring read-only va real API ishlaydi; UI LMS aybdorlikni aniqlamasligini aniq ko'rsatadi | Ichki reglament hamda haqiqiy vakolatli organ qarori yuridik/rahbariyat bilan manual UATda tekshiriladi |
| Masofaviy shakl mumkin bo'lmagan yo'nalishlar (14-band) | Yillik rasmiy katalog va kod-daraja reyestri | `src/pages/admin/distance-program-restrictions.tsx`, `src/services/api/distance-program-restriction-api.ts` | Yil/versiya/vazirlik/hujjat/e'lon/deadline, BACHELOR/MASTER yozuvlari, mustaqil publish/archive, kechikish belgisi, monitoring read-only va real API ishlaydi; UI ro'yxatni LMS yaratmasligini ko'rsatadi | Haqiqiy yillik vazirlik ro'yxati va e'lon manbasi manual UATda kiritilib tekshiriladi |
| 21-band: orientatsiya, yakuniy nazorat va attestatsiyada shaxsan tashrif hamda xorijiy fuqaro istisnosi | Student orientation, teacher exam/DAK roster va student DAK notice | `src/pages/student/orientation.tsx`, `src/pages/teacher/exams.tsx`, `src/pages/teacher/attestations.tsx`, `src/pages/student/attestations.tsx` | Real API ishlaydi: mahalliy talabada qatnashuv tasdig'i gate'i, xorijiy talabada “istisno” badge va davomat tasdig'isiz baholash/yakunlash oqimi bor | Real mahalliy/xorijiy qabul datasetida auditoriya ko'rsatuvi |
| Sifat monitoringi | Monitoring dashboard | `src/pages/statistics.tsx`, `src/pages/reports.tsx` | Qisman mavjud | Alohida monitoring tab: lesson/exam observation, survey, focus group, corrective actions |
| Davlat axborot tizimlari bilan integratsiya | Integration status/settings | `src/pages/settings.tsx`, backend HEMIS modules | Qisman HEMIS backend bor | HEMIS/davlat monitoring integration status, sync logs, error queue UI |
| Rasmiy veb-sahifa axborotlari | Public info/admin content | `src/pages/public/institution-disclosure.tsx`, `src/pages/admin/official-site-publications.tsx`, `src/services/api/official-site-publication-api.ts` | V40 ustav/nizom, o'quv reja-dasturlari, pedagoglar va akademik kalendar uchun manba hujjatli DRAFT/PUBLISHED/REJECTED/ARCHIVED admin workflowi, monitoring read-only va autentifikatsiyasiz public sahifani real APIga uladi; to'liq bo'lmagan 4/4 coverage ochiq ko'rsatiladi | Haqiqiy public matn va manba rekvizitlarini `DEP-07` manual UATda tekshirish |
| O'zDSt 36.2030 kontent muvofiqligi | Checklist va revision assessment | `src/pages/admin/content-standard.tsx`, `src/services/api/content-standard-api.ts`, `src/components/layout/app-sidebar.tsx` | V41 rasmiy manba va validityli checklist versiyasi, dinamik mezonlar, mustaqil publish/reject/archive, aniq kontent revisioni uchun har mezon dalili/izohi, PASSED/FAILED review, admin/metodist write va monitoring read-only oqimini real APIga uladi | Vakolatli manbadagi haqiqiy mezonlarni `DEP-03` bo'yicha kiritish va real kontent bilan manual UAT |
| Yakuniy 559 UAT qabuli | Dalil runi, 27 band reviewi va imzolangan protokol | `src/components/admin/decision-559-uat-panel.tsx`, `src/services/api/decision-559-uat-api.ts`, `src/pages/admin/compliance-559.tsx` | V45–V55 real API: schema-v2 katalogdan 14 partial band/43 real topshiriq, detached SHA'li pack, PARTIAL/BLOCKED holatda faylli qisman checkbox progressi, run tepasida `Manual yig'ildi x/43` va `Manual qabul y/43`, 43 qatorli `PENDING/COLLECTED/ACCEPTED` monitoring reyestri, auditli individual va atomar bulk mas'ul/muddat/izoh koordinatsiyasi, tayinlangan/tayinlanmagan/overdue hisoblari va SHA'li CSV eksport, MANUAL_PASS uchun to'liq qamrov, qoplangan matnlarni reviewer reyestrida ko'rsatish va non-final qabulni bloklash; ko'p-faylli private dalil, canonical protokol, PDF/evidence binding, legacy schema-v2/v3/v4 va progressli schema-v5 manifest hamda `APPROVED` ZIP | Avval maxsus individual tayinlovlar kiritiladi, qolgan qatorlar tavsiya etilgan bo'limlarga bulk taqsimlanadi, hujjat qaytgan sari checklist+fayl progressi saqlanadi va CSV arxivlanadi; 43/43dan keyin boshqa user final review qiladi, V49 loyihasi PDFga chop etilib komissiya imzolaydi va ZIP/SHA/verifier arxivlanadi |

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
- `/api/v1/biometric-governance/*`, `/auth/face/enroll`, `/auth/face/verify`
- `/api/v1/distance-readiness/*`
- `/api/v1/official-site-publications/*`, `/public/api/institution-disclosures`
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
