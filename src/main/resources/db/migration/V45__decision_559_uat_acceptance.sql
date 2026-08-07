-- MON-07: runtime evidence and signed acceptance protocol workflow.
-- Files are stored in private storage; only metadata and SHA-256 are persisted.

CREATE TABLE decision_559_uat_runs (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    source_sha256 VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    protocol_number VARCHAR(100),
    protocol_signed_date DATE,
    protocol_signatories VARCHAR(2000),
    protocol_storage_name VARCHAR(255),
    protocol_original_name VARCHAR(255),
    protocol_content_type VARCHAR(100),
    protocol_size_bytes BIGINT,
    protocol_sha256 VARCHAR(64),
    protocol_uploaded_by BIGINT REFERENCES users(id),
    protocol_uploaded_at TIMESTAMP WITH TIME ZONE,
    submitted_by BIGINT REFERENCES users(id),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by BIGINT REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_by BIGINT REFERENCES users(id),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason VARCHAR(2000),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_559_uat_run_status CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED')),
    CONSTRAINT ck_559_uat_source_sha CHECK (source_sha256 ~ '^[A-F0-9]{64}$'),
    CONSTRAINT ck_559_uat_protocol_sha CHECK (protocol_sha256 IS NULL OR protocol_sha256 ~ '^[a-f0-9]{64}$'),
    CONSTRAINT ck_559_uat_protocol_size CHECK (protocol_size_bytes IS NULL OR protocol_size_bytes BETWEEN 1 AND 10485760)
);
CREATE INDEX idx_559_uat_run_status ON decision_559_uat_runs(status, created_at);

CREATE TABLE decision_559_uat_evidence (
    id BIGSERIAL PRIMARY KEY,
    run_id BIGINT NOT NULL REFERENCES decision_559_uat_runs(id),
    requirement_id VARCHAR(30) NOT NULL,
    band INTEGER NOT NULL,
    outcome VARCHAR(30) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    summary VARCHAR(4000) NOT NULL,
    evidence_reference VARCHAR(1000),
    storage_name VARCHAR(255),
    original_name VARCHAR(255),
    content_type VARCHAR(100),
    size_bytes BIGINT,
    sha256 VARCHAR(64),
    submitted_by BIGINT NOT NULL REFERENCES users(id),
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    review_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    review_notes VARCHAR(2000),
    reviewed_by BIGINT REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_559_uat_evidence_band UNIQUE (run_id, band),
    CONSTRAINT ck_559_uat_evidence_band CHECK (band = 3 OR band BETWEEN 8 AND 33),
    CONSTRAINT ck_559_uat_evidence_requirement CHECK (requirement_id ~ '^UAT-559-[0-9]{2}$'),
    CONSTRAINT ck_559_uat_evidence_outcome CHECK (outcome IN (
        'AUTOMATED_PASS', 'MANUAL_PASS', 'NOT_APPLICABLE', 'PARTIAL', 'BLOCKED_EXTERNAL'
    )),
    CONSTRAINT ck_559_uat_evidence_review CHECK (review_status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    CONSTRAINT ck_559_uat_evidence_sha CHECK (sha256 IS NULL OR sha256 ~ '^[a-f0-9]{64}$'),
    CONSTRAINT ck_559_uat_evidence_size CHECK (size_bytes IS NULL OR size_bytes BETWEEN 1 AND 10485760)
);
CREATE INDEX idx_559_uat_evidence_run ON decision_559_uat_evidence(run_id, band);
CREATE INDEX idx_559_uat_evidence_review ON decision_559_uat_evidence(run_id, review_status, outcome);
