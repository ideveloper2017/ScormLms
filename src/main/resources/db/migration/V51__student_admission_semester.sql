-- Qabuldagi o'quv yili -> dastur -> semestr -> guruh kaskadining semestr dalili.
ALTER TABLE students ADD COLUMN IF NOT EXISTS semester_number INTEGER;

UPDATE students
SET semester_number = LEAST(GREATEST((course_number - 1) * 2 + 1, 1), 12)
WHERE semester_number IS NULL
  AND student_status <> 'REGISTERED';

ALTER TABLE students DROP CONSTRAINT IF EXISTS ck_student_semester_number;
ALTER TABLE students ADD CONSTRAINT ck_student_semester_number CHECK (
    semester_number IS NULL OR semester_number BETWEEN 1 AND 12
);
