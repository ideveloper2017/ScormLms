ALTER TABLE proctoring_sessions DROP CONSTRAINT IF EXISTS ck_proctoring_status;
ALTER TABLE proctoring_sessions ADD CONSTRAINT ck_proctoring_status
    CHECK (status IN ('CHALLENGE_ISSUED', 'VERIFIED', 'FAILED', 'EXPIRED', 'CONSUMED', 'COMPLETED'));

CREATE TABLE IF NOT EXISTS proctoring_events (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES proctoring_sessions(id),
    attempt_id BIGINT NOT NULL REFERENCES quiz_attempts(id),
    type VARCHAR(32) NOT NULL,
    severity VARCHAR(12) NOT NULL,
    source VARCHAR(12) NOT NULL,
    event_key VARCHAR(80) NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_proctoring_event_key UNIQUE (session_id, event_key),
    CONSTRAINT ck_proctoring_event_type CHECK (type IN (
        'SESSION_STARTED', 'SESSION_ENDED', 'CAMERA_STARTED', 'CAMERA_STOPPED',
        'CAMERA_PERMISSION_DENIED', 'TAB_HIDDEN', 'TAB_VISIBLE', 'WINDOW_BLURRED',
        'WINDOW_FOCUSED', 'NETWORK_OFFLINE', 'NETWORK_ONLINE', 'HEARTBEAT', 'PAGE_EXIT'
    )),
    CONSTRAINT ck_proctoring_event_severity CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT ck_proctoring_event_source CHECK (source IN ('SERVER', 'CLIENT'))
);

CREATE INDEX IF NOT EXISTS idx_proctoring_event_attempt_time ON proctoring_events(attempt_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_proctoring_event_risk ON proctoring_events(severity, occurred_at);
