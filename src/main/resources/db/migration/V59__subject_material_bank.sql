ALTER TABLE course_content_assets
    ALTER COLUMN course_id DROP NOT NULL;

ALTER TABLE course_content_assets
    ADD COLUMN subject_id BIGINT REFERENCES subjects(id);

ALTER TABLE course_content_assets
    ADD CONSTRAINT chk_course_content_asset_scope CHECK (
        (course_id IS NOT NULL AND subject_id IS NULL)
        OR (course_id IS NULL AND subject_id IS NOT NULL)
    );

CREATE INDEX idx_course_content_asset_subject
    ON course_content_assets(subject_id, deleted);

CREATE TABLE subject_materials (
    id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT NOT NULL REFERENCES subjects(id),
    asset_id BIGINT REFERENCES course_content_assets(id),
    owner_user_id BIGINT NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(20) NOT NULL,
    content_url VARCHAR(2000),
    content_body TEXT,
    language_code VARCHAR(35) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    content_version VARCHAR(64) NOT NULL,
    source_name VARCHAR(500) NOT NULL,
    source_url VARCHAR(2000),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_subject_material_subject
    ON subject_materials(subject_id, active, deleted);

ALTER TABLE course_contents
    ADD COLUMN subject_material_id BIGINT REFERENCES subject_materials(id);

CREATE INDEX idx_course_content_subject_material
    ON course_contents(subject_material_id);
