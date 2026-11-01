-- O'quv dasturi tuzilmasi: modullar -> darslar (darslar — mavjud mavzular, mashg'ulot turi darsda qoladi)
CREATE TABLE subject_syllabus_modules (
    id BIGSERIAL PRIMARY KEY,
    syllabus_id BIGINT NOT NULL REFERENCES subject_syllabi(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);
CREATE INDEX idx_subject_syllabus_modules_syllabus ON subject_syllabus_modules(syllabus_id, sort_order);

ALTER TABLE subject_syllabus_topics
    ADD COLUMN module_id BIGINT REFERENCES subject_syllabus_modules(id) ON DELETE SET NULL,
    ADD COLUMN lesson_order INTEGER;
CREATE INDEX idx_subject_syllabus_topics_module ON subject_syllabus_topics(module_id, lesson_order);

-- Mavjud mavzular: har dastur va qism (part; bir semestrli fanda 1) uchun bitta modul, darslar avvalgi tartibda
INSERT INTO subject_syllabus_modules (syllabus_id, sort_order, name, created_at, updated_at)
SELECT DISTINCT t.syllabus_id, COALESCE(t.part, 1), COALESCE(t.part, 1) || '-modul', NOW(), NOW()
FROM subject_syllabus_topics t
WHERE t.deleted = FALSE;

UPDATE subject_syllabus_topics t
SET module_id = m.id,
    lesson_order = ordered.position
FROM subject_syllabus_modules m,
     (SELECT id, ROW_NUMBER() OVER (
         PARTITION BY syllabus_id, COALESCE(part, 1)
         ORDER BY CASE topic_type WHEN 'THEORETICAL' THEN 1 WHEN 'PRACTICAL' THEN 2 WHEN 'LABORATORY' THEN 3 ELSE 4 END, sort_order, id
     ) AS position
      FROM subject_syllabus_topics WHERE deleted = FALSE) ordered
WHERE ordered.id = t.id
  AND m.syllabus_id = t.syllabus_id
  AND m.sort_order = COALESCE(t.part, 1);
