CREATE TABLE non_state_education_licenses (
    id BIGSERIAL PRIMARY KEY,
    institution_name VARCHAR(500) NOT NULL,
    license_number VARCHAR(200) NOT NULL,
    issuing_authority VARCHAR(500) NOT NULL,
    issue_date DATE NOT NULL,
    valid_from DATE NOT NULL,
    valid_until DATE,
    official_registry_reference VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    verification_evidence VARCHAR(1000),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by_user_id BIGINT REFERENCES users(id),
    revocation_reason VARCHAR(2000),
    revocation_document_reference VARCHAR(1000),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by_user_id BIGINT REFERENCES users(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uq_non_state_license_number UNIQUE (license_number),
    CONSTRAINT ck_non_state_license_status CHECK (status IN ('DRAFT', 'VERIFIED', 'REVOKED')),
    CONSTRAINT ck_non_state_license_dates CHECK (valid_from >= issue_date AND (valid_until IS NULL OR valid_until >= valid_from)),
    CONSTRAINT ck_non_state_license_workflow CHECK (
        (status = 'DRAFT' AND verification_evidence IS NULL AND verified_at IS NULL AND verified_by_user_id IS NULL AND revoked_at IS NULL AND revoked_by_user_id IS NULL) OR
        (status = 'VERIFIED' AND verification_evidence IS NOT NULL AND verified_at IS NOT NULL AND verified_by_user_id IS NOT NULL AND revoked_at IS NULL AND revoked_by_user_id IS NULL) OR
        (status = 'REVOKED' AND verification_evidence IS NOT NULL AND verified_at IS NOT NULL AND verified_by_user_id IS NOT NULL AND revocation_reason IS NOT NULL AND revocation_document_reference IS NOT NULL AND revoked_at IS NOT NULL AND revoked_by_user_id IS NOT NULL)
    )
);

CREATE TABLE non_state_license_program_scopes (
    id BIGSERIAL PRIMARY KEY,
    license_id BIGINT NOT NULL REFERENCES non_state_education_licenses(id),
    program_id BIGINT NOT NULL REFERENCES programs(id),
    program_code_snapshot VARCHAR(100) NOT NULL,
    program_name_snapshot VARCHAR(500) NOT NULL,
    degree_level_snapshot VARCHAR(30) NOT NULL,
    distance_education_covered BOOLEAN NOT NULL DEFAULT TRUE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uq_license_program_scope UNIQUE (license_id, program_id),
    CONSTRAINT ck_license_scope_degree CHECK (degree_level_snapshot IN ('BACHELOR', 'MASTER')),
    CONSTRAINT ck_license_scope_distance CHECK (distance_education_covered = TRUE)
);

CREATE INDEX idx_non_state_license_status_validity
    ON non_state_education_licenses(status, valid_from, valid_until);
CREATE INDEX idx_license_scope_program
    ON non_state_license_program_scopes(program_id, license_id);
