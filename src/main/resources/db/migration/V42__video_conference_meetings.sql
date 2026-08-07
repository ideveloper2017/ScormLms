CREATE TABLE video_conference_meetings (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES course_learning_sessions(id),
    provider_code VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PROVISIONING',
    idempotency_key VARCHAR(100) NOT NULL,
    provider_meeting_id VARCHAR(250),
    join_url VARCHAR(1000),
    host_url VARCHAR(1000),
    failure_code VARCHAR(100),
    failure_message VARCHAR(1000),
    provision_attempts INTEGER NOT NULL DEFAULT 0,
    last_requested_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ready_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    requested_by_user_id BIGINT NOT NULL REFERENCES users(id),
    cancelled_by_user_id BIGINT REFERENCES users(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uq_video_conference_session UNIQUE (session_id),
    CONSTRAINT uq_video_conference_idempotency UNIQUE (idempotency_key),
    CONSTRAINT ck_video_conference_status CHECK (status IN ('PROVISIONING', 'READY', 'FAILED', 'CANCELLED')),
    CONSTRAINT ck_video_conference_attempts CHECK (provision_attempts BETWEEN 0 AND 20),
    CONSTRAINT ck_video_conference_ready CHECK (
        status <> 'READY' OR
        (provider_meeting_id IS NOT NULL AND join_url IS NOT NULL AND host_url IS NOT NULL AND ready_at IS NOT NULL)
    ),
    CONSTRAINT ck_video_conference_failed CHECK (
        status <> 'FAILED' OR (failure_code IS NOT NULL AND failure_message IS NOT NULL)
    ),
    CONSTRAINT ck_video_conference_cancelled CHECK (
        status <> 'CANCELLED' OR cancelled_at IS NOT NULL
    )
);

CREATE INDEX idx_video_conference_status_requested
    ON video_conference_meetings(status, last_requested_at);
CREATE INDEX idx_video_conference_provider_meeting
    ON video_conference_meetings(provider_code, provider_meeting_id);
