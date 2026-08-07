CREATE TABLE IF NOT EXISTS integration_outbox_events (
    id BIGSERIAL PRIMARY KEY,
    event_key VARCHAR(180) NOT NULL,
    connector VARCHAR(80) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    aggregate_type VARCHAR(80) NOT NULL,
    aggregate_id BIGINT NOT NULL,
    payload TEXT NOT NULL DEFAULT '{}',
    payload_version INTEGER NOT NULL DEFAULT 1,
    priority INTEGER NOT NULL DEFAULT 0,
    event_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    next_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    provider_reference VARCHAR(250),
    last_error_code VARCHAR(100),
    last_error_message VARCHAR(1000),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_integration_outbox_event_key UNIQUE (event_key),
    CONSTRAINT ck_integration_outbox_status CHECK (event_status IN ('PENDING', 'PROCESSING', 'FAILED', 'SUCCEEDED', 'DEAD_LETTER')),
    CONSTRAINT ck_integration_outbox_attempts CHECK (attempt_count >= 0 AND max_attempts > 0),
    CONSTRAINT ck_integration_outbox_payload_version CHECK (payload_version > 0)
);

CREATE TABLE IF NOT EXISTS integration_attempts (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES integration_outbox_events(id),
    attempt_sequence INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_ms BIGINT NOT NULL,
    outcome VARCHAR(20) NOT NULL,
    error_code VARCHAR(100),
    error_message VARCHAR(1000),
    provider_reference VARCHAR(250),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_integration_attempt_sequence UNIQUE (event_id, attempt_sequence),
    CONSTRAINT ck_integration_attempt_outcome CHECK (outcome IN ('SUCCESS', 'RETRY_SCHEDULED', 'DEAD_LETTER')),
    CONSTRAINT ck_integration_attempt_duration CHECK (duration_ms >= 0)
);

CREATE INDEX IF NOT EXISTS idx_integration_outbox_due
    ON integration_outbox_events(event_status, next_attempt_at, priority);
CREATE INDEX IF NOT EXISTS idx_integration_outbox_connector
    ON integration_outbox_events(connector, created_at);
CREATE INDEX IF NOT EXISTS idx_integration_outbox_aggregate
    ON integration_outbox_events(aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_integration_attempt_event
    ON integration_attempts(event_id, attempt_sequence);

-- V22 dagi 5 urinish chegarasi endi outbox eventining max_attempts qiymati bilan
-- boshqariladi. Operator dead-letter eventini qayta navbatga qo'yganda umumiy audit
-- ketma-ketligi 5 dan oshishi mumkin.
ALTER TABLE announcement_deliveries DROP CONSTRAINT IF EXISTS ck_announcement_delivery_attempts;
ALTER TABLE announcement_deliveries ADD CONSTRAINT ck_announcement_delivery_attempts CHECK (attempt_count >= 0);
