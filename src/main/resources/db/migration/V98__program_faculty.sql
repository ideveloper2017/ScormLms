-- Mutaxassislik fakultetga to'g'ridan-to'g'ri bog'lanadi (avval faqat kafedra orqali edi).
-- Mavjudlari kafedrasining fakultetidan to'ldiriladi; kafedra bog'lanishi saqlanadi.
ALTER TABLE programs ADD COLUMN faculty_id BIGINT REFERENCES faculties (id) ON DELETE SET NULL;
CREATE INDEX idx_programs_faculty ON programs (faculty_id);

UPDATE programs p
SET faculty_id = d.faculty_id
FROM departments d
WHERE d.id = p.department_id AND d.faculty_id IS NOT NULL AND p.faculty_id IS NULL;
