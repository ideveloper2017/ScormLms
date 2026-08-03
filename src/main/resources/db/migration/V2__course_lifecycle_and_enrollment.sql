ALTER TABLE courses ADD COLUMN IF NOT EXISTS subject_name VARCHAR(255);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS group_name VARCHAR(255);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

UPDATE courses SET status = 'DRAFT' WHERE status IS NULL OR TRIM(status) = '';
UPDATE courses SET status = UPPER(status);

CREATE TABLE IF NOT EXISTS course_enrollments (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    student_id BIGINT NOT NULL REFERENCES students(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    progress INTEGER NOT NULL DEFAULT 0,
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_course_enrollment UNIQUE (course_id, student_id),
    CONSTRAINT ck_course_enrollment_progress CHECK (progress BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_course_enrollment_course ON course_enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_student ON course_enrollments(student_id, status);
