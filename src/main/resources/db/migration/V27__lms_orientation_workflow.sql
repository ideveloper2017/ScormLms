-- Decision 559, clause 21: in-person LMS orientation before distance learning starts.
-- Existing students are not retroactively blocked because no verifiable attendance evidence exists.
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS lms_orientation_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS lms_orientation_completed_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS lms_orientation_sessions (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    instructions TEXT,
    program_id BIGINT REFERENCES programs(id),
    group_id BIGINT REFERENCES study_groups(id),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    published_at TIMESTAMP WITH TIME ZONE,
    published_by_user_id BIGINT REFERENCES users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by_user_id BIGINT REFERENCES users(id),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by_user_id BIGINT REFERENCES users(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_lms_orientation_period CHECK (ends_at > starts_at),
    CONSTRAINT ck_lms_orientation_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_lms_orientation_status_date
    ON lms_orientation_sessions(status, starts_at);
CREATE INDEX IF NOT EXISTS idx_lms_orientation_scope
    ON lms_orientation_sessions(program_id, group_id, academic_year);

CREATE TABLE IF NOT EXISTS lms_orientation_attendees (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES lms_orientation_sessions(id),
    student_id BIGINT NOT NULL REFERENCES students(id),
    attendance_status VARCHAR(20) NOT NULL DEFAULT 'INVITED',
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_in_by_user_id BIGINT REFERENCES users(id),
    acknowledgement_at TIMESTAMP WITH TIME ZONE,
    acknowledgement_version VARCHAR(50),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_lms_orientation_attendee UNIQUE (session_id, student_id),
    CONSTRAINT ck_lms_orientation_attendance CHECK (attendance_status IN ('INVITED', 'PRESENT', 'ABSENT', 'EXCUSED'))
);

CREATE INDEX IF NOT EXISTS idx_lms_orientation_attendee_session
    ON lms_orientation_attendees(session_id, attendance_status);
CREATE INDEX IF NOT EXISTS idx_lms_orientation_attendee_student
    ON lms_orientation_attendees(student_id, acknowledgement_at);
