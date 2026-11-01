-- Kurs bo'limi o'quv dasturi darsidan yaratilganmi: dars dasturdan o'chirilsa (syllabus_topic_id -> NULL),
-- bo'sh bo'lim sinxronlashda olib tashlanadi; o'qituvchi qo'lda qo'shgan bo'limlarga tegilmaydi.
ALTER TABLE course_modules ADD COLUMN from_syllabus BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE course_modules SET from_syllabus = TRUE WHERE syllabus_topic_id IS NOT NULL;
