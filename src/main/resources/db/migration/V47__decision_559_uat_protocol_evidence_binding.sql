-- Bind newly signed protocols to the exact canonical evidence snapshot (schema v4).
-- Existing IN_REVIEW/APPROVED schema v2/v3 runs remain byte/hash compatible.

ALTER TABLE decision_559_uat_runs
    ADD COLUMN protocol_evidence_set_sha256 VARCHAR(64);

ALTER TABLE decision_559_uat_runs
    ADD CONSTRAINT ck_559_uat_protocol_evidence_sha
        CHECK (protocol_evidence_set_sha256 IS NULL OR protocol_evidence_set_sha256 ~ '^[a-f0-9]{64}$');

ALTER TABLE decision_559_uat_runs
    DROP CONSTRAINT ck_559_uat_manifest_schema;

ALTER TABLE decision_559_uat_runs
    ADD CONSTRAINT ck_559_uat_manifest_schema CHECK (manifest_schema_version IN (2, 3, 4));

UPDATE decision_559_uat_runs
SET manifest_schema_version = 4
WHERE status IN ('DRAFT', 'REJECTED');

ALTER TABLE decision_559_uat_runs
    ALTER COLUMN manifest_schema_version SET DEFAULT 4;
