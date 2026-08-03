CREATE TABLE IF NOT EXISTS course_assignments (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    instructions TEXT NOT NULL DEFAULT '',
    due_at TIMESTAMP WITH TIME ZONE NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 100,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    submission_type VARCHAR(20) NOT NULL DEFAULT 'BOTH',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_course_assignment_score CHECK (max_score BETWEEN 1 AND 1000),
    CONSTRAINT ck_course_assignment_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    CONSTRAINT ck_course_assignment_submission_type CHECK (submission_type IN ('FILE', 'TEXT', 'BOTH')),
    CONSTRAINT ck_course_assignment_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED'))
);
CREATE INDEX IF NOT EXISTS idx_course_assignment_course_due
    ON course_assignments(course_id, due_at);

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES course_assignments(id),
    enrollment_id BIGINT NOT NULL REFERENCES course_enrollments(id),
    attempt_number INTEGER NOT NULL,
    answer TEXT,
    storage_key VARCHAR(64),
    original_file_name VARCHAR(255),
    content_type VARCHAR(150),
    file_size BIGINT,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    late BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    score INTEGER,
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by BIGINT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_assignment_submission_attempt UNIQUE (assignment_id, enrollment_id, attempt_number),
    CONSTRAINT ck_assignment_submission_attempt CHECK (attempt_number > 0),
    CONSTRAINT ck_assignment_submission_status CHECK (status IN ('SUBMITTED', 'GRADED', 'RETURNED')),
    CONSTRAINT ck_assignment_submission_file_size CHECK (file_size IS NULL OR file_size >= 0),
    CONSTRAINT ck_assignment_submission_score CHECK (score IS NULL OR score >= 0)
);
CREATE INDEX IF NOT EXISTS idx_assignment_submission_assignment
    ON assignment_submissions(assignment_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_assignment_submission_enrollment
    ON assignment_submissions(enrollment_id, submitted_at);
