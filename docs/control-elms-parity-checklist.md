# control-eLMS parity checklist

Reference: `https://control-elms.namdtu.uz/` (superadmin UI, inspected 2026-08-21).

Status:

- `NATIVE` — local page has a dedicated working data flow.
- `FILTERED` — shared local module opens with the reference-specific view/filter.
- `ALIAS` — route works, but still opens the closest broader local module.
- `GAP` — a dedicated data model or workflow is still required.

## Top-level and structure

| Reference route | Local status | Local implementation |
|---|---|---|
| `/universities` | NATIVE | University CRUD, language/status, full reference form fields, audit |
| `/structure/faculties` | NATIVE | Faculty CRUD; dean/translation parity remains |
| `/structure/specialities` | NATIVE | Academic program CRUD; reference naming/translation parity remains |

## Ta'lim jarayoni

| Reference route | Local status | Local implementation |
|---|---|---|
| `/edu-process/curriculum` | NATIVE | Versioned study-plan workflow |
| `/edu-process/attached-students` | NATIVE | Curriculum-student assignment |
| `/edu-process/syllabus` | NATIVE | Subject syllabus catalog |
| `/edu-process/academic-years` | FILTERED | Dedicated academic-year view |
| `/edu-process/semesters` | FILTERED | Dedicated semester view |
| `/edu-process/subject-groups` | NATIVE | Subject category CRUD |
| `/edu-process/subjects` | NATIVE | Subject CRUD |
| `/edu-process/rating-systems` | NATIVE | Rating scale CRUD with short name, Min-Max, pass score and status |
| `/edu-process/statements` | NATIVE | Live interim statement registry derived from existing exam sessions/results |
| `/edu-process/total-statements` | NATIVE | Completed-session final statement registry with result aggregates |
| `/controls` | NATIVE | Exam/control module |
| `/edu-process/export-rating-to-hemis` | FILTERED | Live calculated grade registry with HEMIS link/sync state; outbound grade adapter remains GAP |

## O'zlashtirish

| Reference route | Local status | Local implementation |
|---|---|---|
| `/re-reading-subject-groups` | NATIVE | Separate application/contract, credits, payment, debt and approval workflow |
| `/student/re-reading-application` | NATIVE | Separate re-reading plan CRUD with deadline, description and status |
| `/edu-process/academic-debtors` | FILTERED | Live assessed-and-failed enrollment registry with reference filters |
| `/edu-process/gpa-rating-students` | NATIVE | Credit-weighted server-calculated GPA registry |
| `/users/rating-monitoring` | FILTERED | Per-student/per-subject interim, final and total score registry |
| `/users/rating-average` | NATIVE | Per-student assessed-subject average report |
| `/students-reading-recovery-for-rating` | NATIVE | Approved re-reading students joined to the existing assessment result model |

## O'qituvchilar va talabalar

| Reference route | Local status | Local implementation |
|---|---|---|
| `/teachers/tutor-groups` | NATIVE | Dedicated tutor-group CRUD with faculty, tutor and UZ/RU/EN names |
| `/teachers/tutors` | NATIVE | Teacher management |
| `/students/student-groups` | NATIVE | Student group CRUD |
| `/students/students` | NATIVE | Student registry, profile, admission and account actions |
| `/students/graduated` | FILTERED | Student registry filtered to `GRADUATED` |
| `/students/recovery` | FILTERED | Reinstatement-capable suspended registry; completed-event report GAP |
| `/students/academic-leave` | FILTERED | Student registry filtered to `SUSPENDED` |
| `/transfer-students` | FILTERED | Active registry with single/bulk transfer actions |
| `/students/expelled` | FILTERED | Student registry filtered to `EXPELLED` |
| `/student/recovery-study-subjects-info` | NATIVE | Reinstatement subject report |

## Akademik arxiv va monitoring

| Reference route | Local status | Local implementation |
|---|---|---|
| `/call-to-final-exam-letter` | NATIVE | Separate call-letter registry, status/confirmation flow and Unicode PDF generator |
| `/transcript-students` | NATIVE | Separate transcript registry generated from existing grades/credits with Unicode PDF download |
| `/monitoring/students` | FILTERED | Read-only student registry |
| `/monitoring/students-login-date` | NATIVE | Last-login persistence plus configurable inactivity report |
| `/users/not-choose-subject-students` | NATIVE | Optional-course context compared with active student choices |
| `/students/use-syllabus` | NATIVE | Real learning-activity event report for content, SCORM, quiz and sessions |
| `/monitoring/test-results` | NATIVE | Detailed completed-attempt result registry with correct/incorrect counts |
| `/monitoring/teachers` | NATIVE | Teacher registry; last-login column GAP |
| `/check-login-users` | NATIVE | Successful-login audit grouped by student and distinct IPs |
| `/commentary-lessons` | NATIVE | Course forum post report with academic filters and visibility state |

## Yangiliklar, xabarlar va akkauntlar

| Reference route | Local status | Local implementation |
|---|---|---|
| `/content/posts` | NATIVE | Institution/course announcements |
| `/content/schedule` | NATIVE | Academic calendar |
| `/content/online-resource` | NATIVE | Resource catalog |
| `/messages` | NATIVE | Real-time conversation module |
| `/accounts/admins` | NATIVE | User management |
| `/accounts/permission-groups` | NATIVE | Role/permission management |

## Statistika

| Reference route | Local status | Local implementation |
|---|---|---|
| `/statistics-dashbord` | NATIVE | Live degree/gender/course student counts and teacher count |
| `/appropriation` | NATIVE | Program-level assessed average and 2/3/4/5 distribution |
| `/subjects-report` | NATIVE | Course subject/content/teacher/group/review matrix |
| `/subjects-test-report` | NATIVE | Live subject quiz-count report |
| `/teacher-re-reading-report` | NATIVE | Teacher/subject workload aggregation for approved re-reading applications |
| `/student-re-reading-report` | NATIVE | Student contract, payment/debt and assessment summary |
| `/report/semester-subject` | NATIVE | Semester module/resource/assignment/video/test matrix |
| `/student-tasks-report` | NATIVE | Live submission status and grading turnaround report |
| `/users-rating-mark-report` | NATIVE | Per-subject 2/3/4/5 grade distribution |
| `/failed-students` | NATIVE | Course/semester failed-enrollment and distinct-student aggregation |

## Asosiy ma'lumot va sozlamalar

| Reference route | Local status | Local implementation |
|---|---|---|
| `/general-info/labels` | NATIVE | Label key/module/status CRUD with five-language values |
| `/general-info/countries` | FILTERED | Country classifier view |
| `/general-info/regions` | FILTERED | Region classifier view |
| `/general-info/districts` | FILTERED | District classifier view |
| `/general-info/nationalities` | NATIVE | Nationality CRUD with status and five-language values |
| `/settings/configs` | NATIVE | Persisted reference-compatible setting value/status editor |
| `/settings/languages` | NATIVE | Ordered five-language system catalog |
| `/settings/internalization` | NATIVE | CRM/cabinet translation-key CRUD with five-language values |

## Reference-only page facts captured

- 66 navigable routes: 64 nested pages plus `Universitetlar` and `Xabarlar`.
- Every route was opened and its visible title, filters, primary actions and table columns inspected.
- Mailbox has compose, inbox, sent, draft, template and trash views.
- Reference intermittently returned `502 Bad Gateway`; every affected route was retried successfully.
