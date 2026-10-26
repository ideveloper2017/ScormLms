-- Kurs tasdiqlangan fan dasturi (o'quv dasturi) asosida yaratiladi: mavzular kurs modullariga aylanadi
ALTER TABLE courses ADD COLUMN syllabus_id BIGINT REFERENCES subject_syllabi(id);
ALTER TABLE courses ADD COLUMN syllabus_revision INTEGER;
CREATE INDEX idx_courses_syllabus ON courses(syllabus_id);

ALTER TABLE course_modules ADD COLUMN topic_type VARCHAR(20);
ALTER TABLE course_modules ADD COLUMN planned_hours INTEGER;
ALTER TABLE course_modules ADD CONSTRAINT ck_course_module_topic_type CHECK (topic_type IS NULL OR topic_type IN ('THEORETICAL', 'PRACTICAL'));
ALTER TABLE course_modules ADD CONSTRAINT ck_course_module_planned_hours CHECK (planned_hours IS NULL OR planned_hours > 0);
