CREATE TABLE IF NOT EXISTS proctoring_sessions (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES course_quizzes(id),
    enrollment_id BIGINT NOT NULL REFERENCES course_enrollments(id),
    attempt_id BIGINT UNIQUE REFERENCES quiz_attempts(id),
    status VARCHAR(24) NOT NULL,
    challenge_direction VARCHAR(10) NOT NULL,
    nonce_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    consumed_at TIMESTAMP WITH TIME ZONE,
    center_frame_hash VARCHAR(64),
    challenge_frame_hash VARCHAR(64),
    identity_similarity DOUBLE PRECISION,
    movement_delta DOUBLE PRECISION,
    failure_reason VARCHAR(500),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_proctoring_status CHECK (status IN ('CHALLENGE_ISSUED', 'VERIFIED', 'FAILED', 'EXPIRED', 'CONSUMED')),
    CONSTRAINT ck_proctoring_direction CHECK (challenge_direction IN ('LEFT', 'RIGHT')),
    CONSTRAINT ck_proctoring_similarity CHECK (identity_similarity IS NULL OR identity_similarity BETWEEN -1 AND 1)
);

CREATE INDEX IF NOT EXISTS idx_proctoring_owner ON proctoring_sessions(quiz_id, enrollment_id, status);
CREATE INDEX IF NOT EXISTS idx_proctoring_expiry ON proctoring_sessions(expires_at, status);
