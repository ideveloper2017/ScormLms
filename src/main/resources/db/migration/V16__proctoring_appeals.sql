CREATE TABLE IF NOT EXISTS proctoring_appeals (
    id BIGSERIAL PRIMARY KEY,
    attempt_id BIGINT NOT NULL REFERENCES quiz_attempts(id),
    student_id BIGINT NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(16) NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by BIGINT REFERENCES users(id),
    decision TEXT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_proctoring_appeal_attempt UNIQUE (attempt_id),
    CONSTRAINT chk_proctoring_appeal_status CHECK (status IN ('PENDING', 'APPROVED', 'PARTIAL', 'REJECTED')),
    CONSTRAINT chk_proctoring_appeal_review CHECK (
        (status = 'PENDING' AND reviewed_at IS NULL AND reviewed_by IS NULL AND decision IS NULL)
        OR
        (status <> 'PENDING' AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL AND decision IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS proctoring_appeal_events (
    appeal_id BIGINT NOT NULL REFERENCES proctoring_appeals(id),
    event_id BIGINT NOT NULL REFERENCES proctoring_events(id),
    PRIMARY KEY (appeal_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_proctoring_appeal_student ON proctoring_appeals(student_id, requested_at);
CREATE INDEX IF NOT EXISTS idx_proctoring_appeal_status ON proctoring_appeals(status, requested_at);
CREATE INDEX IF NOT EXISTS idx_proctoring_appeal_event ON proctoring_appeal_events(event_id);
