-- V64 / UX-STU-05-DATA: rasmiy ISO/SOATO paketini nazoratli va idempotent import qilish.
ALTER TABLE country_classifiers ADD COLUMN managed_source VARCHAR(30);
ALTER TABLE country_classifiers ADD COLUMN source_code VARCHAR(30);
ALTER TABLE country_classifiers ADD COLUMN source_version VARCHAR(150);
ALTER TABLE region_classifiers ADD COLUMN managed_source VARCHAR(30);
ALTER TABLE region_classifiers ADD COLUMN source_code VARCHAR(30);
ALTER TABLE region_classifiers ADD COLUMN source_version VARCHAR(150);
ALTER TABLE district_classifiers ADD COLUMN managed_source VARCHAR(30);
ALTER TABLE district_classifiers ADD COLUMN source_code VARCHAR(30);
ALTER TABLE district_classifiers ADD COLUMN source_version VARCHAR(150);

ALTER TABLE country_classifiers ADD CONSTRAINT uk_country_classifier_source UNIQUE (managed_source, source_code);
ALTER TABLE region_classifiers ADD CONSTRAINT uk_region_classifier_source UNIQUE (managed_source, source_code);
ALTER TABLE district_classifiers ADD CONSTRAINT uk_district_classifier_source UNIQUE (managed_source, source_code);

CREATE TABLE classifier_import_runs (
    id BIGSERIAL PRIMARY KEY,
    dataset_id VARCHAR(80) NOT NULL,
    dataset_version VARCHAR(180) NOT NULL,
    manifest_sha256 VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL,
    started_by_user_id BIGINT NOT NULL,
    countries_total INTEGER NOT NULL DEFAULT 0,
    regions_total INTEGER NOT NULL DEFAULT 0,
    districts_total INTEGER NOT NULL DEFAULT 0,
    created_count INTEGER NOT NULL DEFAULT 0,
    updated_count INTEGER NOT NULL DEFAULT 0,
    unchanged_count INTEGER NOT NULL DEFAULT 0,
    deactivated_count INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_classifier_import_status CHECK (status IN ('RUNNING', 'COMPLETED'))
);
CREATE INDEX idx_classifier_import_run_created ON classifier_import_runs(created_at DESC);

CREATE TABLE classifier_import_control (
    id BIGINT PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0
);
INSERT INTO classifier_import_control(id, version) VALUES (1, 0);
