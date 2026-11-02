-- Kurs tuzilmasi o'quv dasturidagi kabi: modul -> dars -> material.
-- Kurs moduli dastur moduliga bog'lanadi; darslar (course_modules) modulga, materiallar (course_contents) darsga.
CREATE TABLE course_units (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 1,
    syllabus_module_id BIGINT REFERENCES subject_syllabus_modules(id) ON DELETE SET NULL,
    from_syllabus BOOLEAN NOT NULL DEFAULT FALSE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_course_unit_position CHECK (position > 0)
);
CREATE INDEX idx_course_unit_order ON course_units(course_id, position);

ALTER TABLE course_modules ADD COLUMN unit_id BIGINT REFERENCES course_units(id) ON DELETE SET NULL;
CREATE INDEX idx_course_module_unit ON course_modules(unit_id);

-- Mavjud kurslar: dastur darsidan yaratilgan bo'limlar o'sha dars moduli nomidagi kurs moduliga yig'iladi
INSERT INTO course_units (course_id, title, description, position, syllabus_module_id, from_syllabus, created_at, updated_at)
SELECT DISTINCT cm.course_id, sm.name, sm.description, sm.sort_order, sm.id, TRUE, NOW(), NOW()
FROM course_modules cm
JOIN subject_syllabus_topics t ON t.id = cm.syllabus_topic_id
JOIN subject_syllabus_modules sm ON sm.id = t.module_id
WHERE cm.deleted = FALSE AND sm.deleted = FALSE;

UPDATE course_modules cm
SET unit_id = u.id
FROM subject_syllabus_topics t, course_units u
WHERE t.id = cm.syllabus_topic_id
  AND u.course_id = cm.course_id
  AND u.syllabus_module_id = t.module_id
  AND cm.deleted = FALSE;
