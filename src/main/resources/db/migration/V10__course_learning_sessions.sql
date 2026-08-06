CREATE TABLE IF NOT EXISTS course_learning_sessions (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    format VARCHAR(30) NOT NULL,
    session_type VARCHAR(30) NOT NULL DEFAULT 'LECTURE',
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    room VARCHAR(255),
    building VARCHAR(255),
    live_url VARCHAR(1000),
    recording_url VARCHAR(1000),
    resource_url VARCHAR(1000),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_learning_session_format CHECK (format IN ('SYNCHRONOUS', 'ASYNCHRONOUS')),
    CONSTRAINT ck_learning_session_type CHECK (session_type IN ('LECTURE', 'LAB', 'SEMINAR', 'TUTORIAL')),
    CONSTRAINT ck_learning_session_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED')),
    CONSTRAINT ck_learning_session_window CHECK (starts_at < ends_at)
);
CREATE INDEX IF NOT EXISTS idx_learning_session_course_time ON course_learning_sessions(course_id, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_learning_session_status_time ON course_learning_sessions(status, starts_at);

CREATE TABLE IF NOT EXISTS learning_session_accesses (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES course_learning_sessions(id),
    enrollment_id BIGINT NOT NULL REFERENCES course_enrollments(id),
    access_type VARCHAR(30) NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_session_access_type CHECK (access_type IN ('LIVE_JOIN', 'RECORDING_OPEN', 'RESOURCE_OPEN')),
    CONSTRAINT ck_session_access_duration CHECK (duration_seconds BETWEEN 0 AND 86400)
);
CREATE INDEX IF NOT EXISTS idx_session_access_session_time ON learning_session_accesses(session_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_session_access_enrollment ON learning_session_accesses(enrollment_id, occurred_at);
