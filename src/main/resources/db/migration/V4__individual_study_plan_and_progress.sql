ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20) NOT NULL DEFAULT '';
ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS semester INTEGER NOT NULL DEFAULT 1;
ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0;
ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS required BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE course_enrollments ADD CONSTRAINT ck_course_enrollment_semester CHECK (semester BETWEEN 1 AND 20);
ALTER TABLE course_enrollments ADD CONSTRAINT ck_course_enrollment_credits CHECK (credits BETWEEN 0 AND 100);

CREATE INDEX IF NOT EXISTS idx_course_enrollment_study_plan
    ON course_enrollments(student_id, academic_year, semester, status);

CREATE TABLE IF NOT EXISTS course_content_progress (
    id BIGSERIAL PRIMARY KEY,
    enrollment_id BIGINT NOT NULL REFERENCES course_enrollments(id),
    content_id BIGINT NOT NULL REFERENCES course_contents(id),
    progress INTEGER NOT NULL DEFAULT 0,
    first_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_course_content_progress UNIQUE (enrollment_id, content_id),
    CONSTRAINT ck_course_content_progress_value CHECK (progress BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_content_progress_enrollment ON course_content_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_content_progress_content ON course_content_progress(content_id);
