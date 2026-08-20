CREATE TABLE course_content_assets (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    storage_key VARCHAR(64) NOT NULL,
    original_file_name VARCHAR(500) NOT NULL,
    media_type VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    uploaded_by BIGINT NOT NULL,
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_course_content_asset_storage_key UNIQUE (storage_key),
    CONSTRAINT chk_course_content_asset_size CHECK (size_bytes > 0)
);

CREATE INDEX idx_course_content_asset_course
    ON course_content_assets(course_id, deleted);

ALTER TABLE course_contents
    ADD COLUMN content_body TEXT;

ALTER TABLE course_contents
    ADD COLUMN asset_id BIGINT REFERENCES course_content_assets(id);

CREATE INDEX idx_course_content_asset
    ON course_contents(asset_id);

ALTER TABLE course_content_revisions
    ADD COLUMN content_body TEXT;

ALTER TABLE course_content_revisions
    ADD COLUMN asset_id BIGINT REFERENCES course_content_assets(id);

CREATE INDEX idx_course_content_revision_asset
    ON course_content_revisions(asset_id);
