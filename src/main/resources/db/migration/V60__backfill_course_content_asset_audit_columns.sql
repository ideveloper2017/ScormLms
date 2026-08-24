-- Some databases applied the first V58 draft before BaseEntity audit columns
-- were added. Keep the forward migration idempotent for both upgraded and clean
-- installations.
ALTER TABLE course_content_assets
    ADD COLUMN IF NOT EXISTS created_by BIGINT;

ALTER TABLE course_content_assets
    ADD COLUMN IF NOT EXISTS updated_by BIGINT;

ALTER TABLE course_content_assets
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE course_content_assets
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;
