-- ELMS-compatible subject grouping: a catalog category such as Mathematics,
-- Physics or Foreign Languages. Operational teaching cohorts remain in
-- academic_subject_groups and are intentionally not migrated into this table.
CREATE TABLE subject_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_subject_category_code UNIQUE (code)
);

CREATE INDEX idx_subject_category_state_name
    ON subject_categories(active, deleted, name);

ALTER TABLE subjects
    ADD COLUMN subject_category_id BIGINT;

ALTER TABLE subjects
    ADD CONSTRAINT fk_subject_category
        FOREIGN KEY (subject_category_id) REFERENCES subject_categories(id);

CREATE INDEX idx_subjects_subject_category
    ON subjects(subject_category_id);
