-- Kurs bo'limi (modul) qaysi o'quv dasturi mavzusidan yaratilganini bog'lash: sinxronlash va mavzudan tanlash uchun
ALTER TABLE course_modules ADD COLUMN syllabus_topic_id BIGINT REFERENCES subject_syllabus_topics(id) ON DELETE SET NULL;
CREATE INDEX idx_course_modules_syllabus_topic ON course_modules(syllabus_topic_id);

-- V80 orqali dasturdan yaratilgan modullarni tur va nom bo'yicha mavzularga bog'lash
UPDATE course_modules m
SET syllabus_topic_id = t.id
FROM courses c, subject_syllabus_topics t
WHERE m.course_id = c.id
  AND c.syllabus_id = t.syllabus_id
  AND m.topic_type = t.topic_type
  AND m.title = LEFT(t.title, 255)
  AND m.syllabus_topic_id IS NULL
  AND m.deleted = FALSE;
