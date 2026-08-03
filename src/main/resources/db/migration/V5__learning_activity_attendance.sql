CREATE TABLE IF NOT EXISTS course_attendance_sessions (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    title VARCHAR(255) NOT NULL,
    opens_at TIMESTAMP WITH TIME ZONE NOT NULL,
    closes_at TIMESTAMP WITH TIME ZONE NOT NULL,
    late_after TIMESTAMP WITH TIME ZONE,
    minimum_activity_seconds INTEGER NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_attendance_session_window CHECK (opens_at < closes_at),
    CONSTRAINT ck_attendance_session_late CHECK (late_after IS NULL OR (late_after >= opens_at AND late_after <= closes_at)),
    CONSTRAINT ck_attendance_session_min_activity CHECK (minimum_activity_seconds BETWEEN 0 AND 86400)
);
CREATE INDEX IF NOT EXISTS idx_attendance_session_course_time
    ON course_attendance_sessions(course_id, opens_at, closes_at);

CREATE TABLE IF NOT EXISTS learning_activity_events (
    id BIGSERIAL PRIMARY KEY,
    enrollment_id BIGINT NOT NULL REFERENCES course_enrollments(id),
    event_type VARCHAR(30) NOT NULL,
    source_type VARCHAR(30) NOT NULL,
    source_id BIGINT NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_learning_activity_duration CHECK (duration_seconds BETWEEN 0 AND 86400)
);
CREATE INDEX IF NOT EXISTS idx_learning_activity_enrollment_time
    ON learning_activity_events(enrollment_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_learning_activity_source
    ON learning_activity_events(source_type, source_id);
