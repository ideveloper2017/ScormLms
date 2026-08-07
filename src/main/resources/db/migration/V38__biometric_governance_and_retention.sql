CREATE TABLE biometric_policies (
    id BIGSERIAL PRIMARY KEY,
    version_code VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    purpose_text VARCHAR(2000) NOT NULL,
    legal_basis VARCHAR(2000) NOT NULL,
    consent_text TEXT NOT NULL,
    privacy_notice TEXT NOT NULL,
    document_number VARCHAR(200) NOT NULL,
    document_date DATE NOT NULL,
    document_reference VARCHAR(1000) NOT NULL,
    face_template_retention_days INTEGER NOT NULL,
    proctoring_evidence_retention_days INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    published_slot SMALLINT,
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    published_at TIMESTAMP WITH TIME ZONE,
    published_by_user_id BIGINT REFERENCES users(id),
    approval_note VARCHAR(2000),
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_biometric_policy_version UNIQUE (version_code),
    CONSTRAINT uq_biometric_policy_published_slot UNIQUE (published_slot),
    CONSTRAINT ck_biometric_policy_retention CHECK (
        face_template_retention_days BETWEEN 1 AND 3650
        AND proctoring_evidence_retention_days BETWEEN 1 AND 3650
    ),
    CONSTRAINT ck_biometric_policy_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    CONSTRAINT ck_biometric_policy_published_slot CHECK (
        (status = 'PUBLISHED' AND published_slot = 1) OR
        (status <> 'PUBLISHED' AND published_slot IS NULL)
    ),
    CONSTRAINT ck_biometric_policy_publish_fields CHECK (
        (status = 'DRAFT' AND published_at IS NULL AND published_by_user_id IS NULL AND approval_note IS NULL) OR
        (status IN ('PUBLISHED', 'ARCHIVED') AND published_at IS NOT NULL AND published_by_user_id IS NOT NULL AND approval_note IS NOT NULL)
    ),
    CONSTRAINT ck_biometric_policy_archive_fields CHECK (
        (status <> 'ARCHIVED' AND archived_at IS NULL AND archived_by_user_id IS NULL) OR
        (status = 'ARCHIVED' AND archived_at IS NOT NULL AND archived_by_user_id IS NOT NULL)
    )
);

CREATE TABLE biometric_consent_events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    policy_id BIGINT NOT NULL REFERENCES biometric_policies(id),
    action VARCHAR(20) NOT NULL,
    statement_hash VARCHAR(64) NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    actor_user_id BIGINT NOT NULL REFERENCES users(id),
    reason VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT ck_biometric_consent_action CHECK (action IN ('GRANTED', 'WITHDRAWN')),
    CONSTRAINT ck_biometric_consent_reason CHECK (
        (action = 'GRANTED' AND reason IS NULL) OR
        (action = 'WITHDRAWN' AND reason IS NOT NULL)
    )
);

CREATE INDEX idx_biometric_consent_latest
    ON biometric_consent_events(user_id, policy_id, occurred_at DESC, id DESC);

ALTER TABLE users ADD COLUMN face_policy_id BIGINT REFERENCES biometric_policies(id);
ALTER TABLE users ADD COLUMN face_consent_event_id BIGINT REFERENCES biometric_consent_events(id);
ALTER TABLE users ADD COLUMN face_expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE proctoring_sessions ADD COLUMN biometric_policy_id BIGINT REFERENCES biometric_policies(id);
ALTER TABLE proctoring_sessions ADD COLUMN biometric_consent_event_id BIGINT REFERENCES biometric_consent_events(id);
ALTER TABLE proctoring_sessions ADD COLUMN biometric_retention_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE proctoring_sessions ADD COLUMN biometric_purged_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_user_face_retention ON users(face_expires_at);
CREATE INDEX idx_proctoring_biometric_retention ON proctoring_sessions(biometric_retention_until, biometric_purged_at);

CREATE TABLE biometric_purge_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    policy_id BIGINT REFERENCES biometric_policies(id),
    asset_type VARCHAR(30) NOT NULL,
    reason VARCHAR(1000) NOT NULL,
    due_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    file_deleted BOOLEAN,
    executed_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT ck_biometric_purge_asset CHECK (asset_type IN ('FACE_TEMPLATE', 'PROCTORING_EVIDENCE'))
);

CREATE INDEX idx_biometric_purge_user_time ON biometric_purge_records(user_id, executed_at DESC);
