CREATE TABLE program_curriculum_versions (
    id BIGSERIAL PRIMARY KEY,
    program_id BIGINT NOT NULL REFERENCES programs(id),
    version_code VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    credential_type VARCHAR(30) NOT NULL,
    normative_basis_type VARCHAR(40) NOT NULL,
    standard_reference VARCHAR(1000) NOT NULL,
    qualification_requirements_reference VARCHAR(1000) NOT NULL,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    approval_order_number VARCHAR(200),
    approval_order_date DATE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by_user_id BIGINT REFERENCES users(id),
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by_user_id BIGINT REFERENCES users(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uq_curriculum_program_version UNIQUE (program_id, version_code),
    CONSTRAINT ck_curriculum_credential CHECK (credential_type IN ('STATE_DIPLOMA', 'NON_STATE_CREDENTIAL')),
    CONSTRAINT ck_curriculum_basis CHECK (normative_basis_type IN ('STATE_EDUCATION_STANDARD', 'PROFESSIONAL_STANDARD')),
    CONSTRAINT ck_curriculum_status CHECK (status IN ('DRAFT', 'APPROVED', 'ARCHIVED')),
    CONSTRAINT ck_curriculum_validity CHECK (valid_until >= valid_from),
    CONSTRAINT ck_curriculum_basis_match CHECK (
        (credential_type = 'STATE_DIPLOMA' AND normative_basis_type = 'STATE_EDUCATION_STANDARD')
        OR
        (credential_type = 'NON_STATE_CREDENTIAL' AND normative_basis_type = 'PROFESSIONAL_STANDARD')
    )
);

CREATE TABLE program_curriculum_subjects (
    id BIGSERIAL PRIMARY KEY,
    curriculum_version_id BIGINT NOT NULL REFERENCES program_curriculum_versions(id),
    subject_id BIGINT REFERENCES subjects(id) ON DELETE SET NULL,
    subject_code_snapshot VARCHAR(100) NOT NULL,
    subject_name_snapshot VARCHAR(500) NOT NULL,
    credits_snapshot INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    plan_item_type VARCHAR(20) NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uq_curriculum_subject UNIQUE (curriculum_version_id, subject_id),
    CONSTRAINT ck_curriculum_subject_credits CHECK (credits_snapshot BETWEEN 1 AND 60),
    CONSTRAINT ck_curriculum_subject_semester CHECK (semester BETWEEN 1 AND 12),
    CONSTRAINT ck_curriculum_subject_type CHECK (plan_item_type IN ('REQUIRED', 'ELECTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_curriculum_program_year_status
    ON program_curriculum_versions(program_id, academic_year, status);
CREATE INDEX IF NOT EXISTS idx_curriculum_status_validity
    ON program_curriculum_versions(status, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_curriculum_subject_order
    ON program_curriculum_subjects(curriculum_version_id, semester, subject_name_snapshot);

