-- Fan oqimlari (academic subject groups) tizimdan butunlay olib tashlandi (foydalanuvchi qarori, 2026-11-04).
-- O'qituvchi fani — teachers.subjects, talaba fani — o'quv reja, kursga yozilish — kurs o'zi.
-- Diqqat: oqimlar, ularga a'zolik va o'qituvchi biriktirishlari qaytarib bo'lmaydigan tarzda o'chiriladi.
DROP INDEX IF EXISTS idx_course_subject_group;
ALTER TABLE courses DROP COLUMN IF EXISTS subject_group_id;

DROP TABLE IF EXISTS academic_subject_group_teacher_assignments;
DROP TABLE IF EXISTS academic_subject_group_memberships;
DROP TABLE IF EXISTS academic_subject_groups;
