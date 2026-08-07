ALTER TABLE courses ADD COLUMN subject_id BIGINT;

ALTER TABLE courses
    ADD CONSTRAINT fk_course_subject
    FOREIGN KEY (subject_id) REFERENCES subjects(id);

CREATE INDEX IF NOT EXISTS idx_course_subject_id ON courses(subject_id);
