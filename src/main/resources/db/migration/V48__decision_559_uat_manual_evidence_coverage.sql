-- Bind schema-v5 UAT evidence to the exact manual checklist coverage selected by the submitter.
-- Final legacy schema-v2/v3/v4 runs keep their existing evidence-set hash contract.

ALTER TABLE decision_559_uat_evidence
    ADD COLUMN manual_evidence_coverage VARCHAR(4000) NOT NULL DEFAULT '';

ALTER TABLE decision_559_uat_runs
    DROP CONSTRAINT ck_559_uat_manifest_schema;

ALTER TABLE decision_559_uat_runs
    ADD CONSTRAINT ck_559_uat_manifest_schema CHECK (manifest_schema_version IN (2, 3, 4, 5));

UPDATE decision_559_uat_runs
SET manifest_schema_version = 5
WHERE status IN ('DRAFT', 'REJECTED');

-- Existing editable runs have no trustworthy mapping from their old evidence to the new 43-item catalog.
-- Re-open all 14 manual bands so the submitter must record coverage and an independent reviewer must accept it again.
UPDATE decision_559_uat_evidence
SET review_status = 'PENDING',
    review_notes = NULL,
    reviewed_by = NULL,
    reviewed_at = NULL
WHERE band IN (8, 9, 10, 11, 12, 14, 15, 16, 22, 25, 27, 28, 29, 33)
  AND run_id IN (
      SELECT id FROM decision_559_uat_runs WHERE status IN ('DRAFT', 'REJECTED')
  );

ALTER TABLE decision_559_uat_runs
    ALTER COLUMN manifest_schema_version SET DEFAULT 5;
