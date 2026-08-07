-- Preserve already signed/in-review V45 manifests as schema v2 while allowing
-- editable and future runs to use independently hashed multi-file evidence (v3).

ALTER TABLE decision_559_uat_runs
    ADD COLUMN manifest_schema_version INTEGER NOT NULL DEFAULT 2;

UPDATE decision_559_uat_runs
SET manifest_schema_version = 3
WHERE status IN ('DRAFT', 'REJECTED');

ALTER TABLE decision_559_uat_runs
    ALTER COLUMN manifest_schema_version SET DEFAULT 3;

ALTER TABLE decision_559_uat_runs
    ADD CONSTRAINT ck_559_uat_manifest_schema CHECK (manifest_schema_version IN (2, 3));

CREATE TABLE decision_559_uat_evidence_files (
    id BIGSERIAL PRIMARY KEY,
    evidence_id BIGINT NOT NULL REFERENCES decision_559_uat_evidence(id),
    storage_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    uploaded_by BIGINT NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_559_uat_file_type CHECK (content_type IN ('application/pdf', 'image/png', 'image/jpeg')),
    CONSTRAINT ck_559_uat_file_sha CHECK (sha256 ~ '^[a-f0-9]{64}$'),
    CONSTRAINT ck_559_uat_file_size CHECK (size_bytes BETWEEN 1 AND 10485760)
);

CREATE INDEX idx_559_uat_file_evidence
    ON decision_559_uat_evidence_files(evidence_id, id);

INSERT INTO decision_559_uat_evidence_files(
    evidence_id, storage_name, original_name, content_type, size_bytes, sha256,
    uploaded_by, uploaded_at, deleted, created_at, updated_at, created_by, updated_by
)
SELECT id, storage_name, original_name, content_type, size_bytes, sha256,
       submitted_by, submitted_at, FALSE, created_at, updated_at, created_by, updated_by
FROM decision_559_uat_evidence
WHERE storage_name IS NOT NULL
  AND original_name IS NOT NULL
  AND content_type IS NOT NULL
  AND size_bytes IS NOT NULL
  AND sha256 IS NOT NULL;
