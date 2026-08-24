# ELMS compatibility map

Source reviewed read-only on 2026-08-20: `control-elms.namdtu.uz` super-admin cabinet.

## Reference navigation

- Structure: universities, faculties, specialities.
- Education process: curricula, curriculum students, syllabi, academic years,
  curriculum semesters, subject groups, subjects, rating systems, statements,
  final statements, controls, HEMIS grade export.
- Mastery: retakes, retake applications, academic debtors, GPA, rating
  monitoring, average results and recovery grading.
- Teachers: teacher groups and teachers.
- Students: primary groups, active students, graduates, reinstated students and
  academic leave.
- Student movement/archive: transfers, expelled students, reinstatement subject
  report, final-exam call letter and transcript.
- Monitoring: student/teacher activity, unselected electives, test results,
  login IP checks and lesson comments.
- Content/accounts/statistics/catalogs/settings are separate menu groups.

## Academic chain observed

`Faculty -> Speciality -> Academic year -> Subject group (catalog) -> Subject ->
Curriculum -> Curriculum semester -> Syllabus -> Curriculum student assignment ->
Control -> Statement -> Final statement -> HEMIS export`

Important semantics:

- Reference **subject groups** are catalog categories such as Oliy matematika,
  Fizika and Xorijiy tillar. They never contain students.
- A subject has name, code, optional special type (`practice`, `course_work`,
  state attestation or graduation work), category and five translations.
- Curriculum subjects are attached to semester slots after the curriculum is
  created. Curriculum rows carry faculty, speciality, number of semesters,
  academic years, education form, language and confirmation state.
- Curriculum semesters carry curriculum, academic year, start/end dates and
  active state.
- Students are explicitly attached using curriculum + academic year + semester;
  their primary student group remains separate.
- A syllabus carries name, language, short description, requirements, rich full
  description, image/video and later program/subject links.

## Local mapping

| Reference | Local module | State |
|---|---|---|
| Faculties | `faculties` | Present |
| Specialities | `programs` | Present; user-facing label is Yo'nalish |
| Academic years | `academic_year_periods` | Present |
| Subject groups (catalog) | `subject_categories` | Added in V61 |
| Subjects | `subjects` | Present; V62 adds type and translations |
| Curricula | `program_curriculum_versions/subjects` | Present with approval snapshot |
| Curriculum semesters | `curriculum_semester_periods` | Added in V62 |
| Curriculum students | `curriculum_student_assignments` | Added in V62 |
| Syllabi | `subject_syllabi` | Added in V62 |
| Teaching cohorts | `academic_subject_groups` | Local extension; UI label is Fan oqimlari |
| Teacher material bank | `subject_materials` | Local extension; linked to assigned subjects |
| Controls/gradebook | quizzes, exams, assignments, gradebook | Present, not yet unified as ELMS statement catalog |
| HEMIS | sync/export modules | Present |

The implementation deliberately preserves stronger local audit, approval,
biometric, SCORM and 559-compliance features instead of replacing them with the
reference site's simpler records.
