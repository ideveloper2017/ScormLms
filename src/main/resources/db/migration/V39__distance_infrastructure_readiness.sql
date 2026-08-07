CREATE TABLE distance_infrastructure_readiness_profiles (
    id BIGSERIAL PRIMARY KEY,
    version_code VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    internet_provider VARCHAR(500) NOT NULL,
    internet_capacity_mbps DECIMAL(12,2) NOT NULL,
    internet_evidence_reference VARCHAR(1000) NOT NULL,
    computer_facility_address VARCHAR(1000) NOT NULL,
    sanitation_document_number VARCHAR(200) NOT NULL,
    sanitation_document_date DATE NOT NULL,
    sanitation_evidence_reference VARCHAR(1000) NOT NULL,
    technical_staff_count INTEGER NOT NULL,
    technical_staff_qualification_reference VARCHAR(1000) NOT NULL,
    planned_distance_students INTEGER NOT NULL,
    server_capacity_students INTEGER NOT NULL,
    server_ownership_type VARCHAR(20) NOT NULL,
    server_country_code VARCHAR(2) NOT NULL,
    server_location_address VARCHAR(1000) NOT NULL,
    server_document_number VARCHAR(200) NOT NULL,
    server_document_date DATE NOT NULL,
    server_evidence_reference VARCHAR(1000) NOT NULL,
    lease_start_date DATE,
    lease_end_date DATE,
    official_website_url VARCHAR(1000) NOT NULL,
    website_has_charter BOOLEAN NOT NULL,
    website_has_curricula BOOLEAN NOT NULL,
    website_has_staff_information BOOLEAN NOT NULL,
    website_has_academic_calendar BOOLEAN NOT NULL,
    website_reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    verified_slot SMALLINT,
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by_user_id BIGINT REFERENCES users(id),
    review_note VARCHAR(2000),
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_distance_readiness_version UNIQUE (version_code),
    CONSTRAINT uq_distance_readiness_verified_slot UNIQUE (verified_slot),
    CONSTRAINT ck_distance_readiness_positive CHECK (
        internet_capacity_mbps > 0 AND technical_staff_count > 0
        AND planned_distance_students > 0 AND server_capacity_students >= planned_distance_students
    ),
    CONSTRAINT ck_distance_readiness_server_country CHECK (server_country_code = 'UZ'),
    CONSTRAINT ck_distance_readiness_ownership CHECK (
        (server_ownership_type = 'OWNED' AND lease_start_date IS NULL AND lease_end_date IS NULL) OR
        (server_ownership_type = 'LEASED' AND lease_start_date IS NOT NULL AND lease_end_date IS NOT NULL AND lease_end_date > lease_start_date)
    ),
    CONSTRAINT ck_distance_readiness_status CHECK (status IN ('DRAFT', 'VERIFIED', 'REJECTED', 'ARCHIVED')),
    CONSTRAINT ck_distance_readiness_verified_slot CHECK (
        (status = 'VERIFIED' AND verified_slot = 1) OR (status <> 'VERIFIED' AND verified_slot IS NULL)
    ),
    CONSTRAINT ck_distance_readiness_review CHECK (
        (status = 'DRAFT' AND reviewed_at IS NULL AND reviewed_by_user_id IS NULL AND review_note IS NULL) OR
        (status IN ('VERIFIED', 'REJECTED', 'ARCHIVED') AND reviewed_at IS NOT NULL AND reviewed_by_user_id IS NOT NULL AND review_note IS NOT NULL)
    ),
    CONSTRAINT ck_distance_readiness_archive CHECK (
        (status <> 'ARCHIVED' AND archived_at IS NULL AND archived_by_user_id IS NULL) OR
        (status = 'ARCHIVED' AND archived_at IS NOT NULL AND archived_by_user_id IS NOT NULL)
    ),
    CONSTRAINT ck_distance_readiness_verified_website CHECK (
        status <> 'VERIFIED' OR (
            website_has_charter = TRUE AND website_has_curricula = TRUE
            AND website_has_staff_information = TRUE AND website_has_academic_calendar = TRUE
        )
    )
);

CREATE INDEX idx_distance_readiness_status ON distance_infrastructure_readiness_profiles(status, created_at);

