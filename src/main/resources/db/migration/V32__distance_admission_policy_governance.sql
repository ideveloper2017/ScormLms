CREATE TABLE distance_admission_policies (
    id BIGSERIAL PRIMARY KEY,
    program_id BIGINT NOT NULL REFERENCES programs(id),
    academic_year VARCHAR(9) NOT NULL,
    version_code VARCHAR(100) NOT NULL,
    institution_governance_type VARCHAR(40) NOT NULL,
    approval_authority_type VARCHAR(40) NOT NULL,
    institution_name VARCHAR(500) NOT NULL,
    approving_authority_name VARCHAR(500) NOT NULL,
    admission_quota INTEGER NOT NULL,
    contract_amount NUMERIC(16,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'UZS',
    higher_education_ministry_agreement_reference VARCHAR(1000),
    economy_ministry_agreement_reference VARCHAR(1000),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    approval_document_number VARCHAR(200),
    approval_document_date DATE,
    approval_document_reference VARCHAR(1000),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by_user_id BIGINT REFERENCES users(id),
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_admission_policy_program_year_version UNIQUE (program_id, academic_year, version_code),
    CONSTRAINT ck_admission_policy_year CHECK (academic_year ~ '^[0-9]{4}-[0-9]{4}$'),
    CONSTRAINT ck_admission_policy_quota CHECK (admission_quota > 0),
    CONSTRAINT ck_admission_policy_amount CHECK (contract_amount > 0),
    CONSTRAINT ck_admission_policy_currency CHECK (currency = 'UZS'),
    CONSTRAINT ck_admission_policy_status CHECK (status IN ('DRAFT', 'APPROVED', 'ARCHIVED')),
    CONSTRAINT ck_admission_policy_governance CHECK (institution_governance_type IN ('STATE_STANDARD', 'STATE_FINANCIALLY_AUTONOMOUS', 'NON_STATE')),
    CONSTRAINT ck_admission_policy_authority CHECK (
        (institution_governance_type = 'STATE_STANDARD' AND approval_authority_type = 'SUBORDINATE_MINISTRY_AGENCY') OR
        (institution_governance_type = 'STATE_FINANCIALLY_AUTONOMOUS' AND approval_authority_type = 'SUPERVISORY_BOARD') OR
        (institution_governance_type = 'NON_STATE' AND approval_authority_type = 'FOUNDER')
    ),
    CONSTRAINT ck_admission_policy_agreements CHECK (
        (institution_governance_type = 'STATE_STANDARD' AND higher_education_ministry_agreement_reference IS NOT NULL AND economy_ministry_agreement_reference IS NOT NULL) OR
        (institution_governance_type <> 'STATE_STANDARD' AND higher_education_ministry_agreement_reference IS NULL AND economy_ministry_agreement_reference IS NULL)
    ),
    CONSTRAINT ck_admission_policy_approval_fields CHECK (
        (status = 'DRAFT' AND approval_document_number IS NULL AND approval_document_date IS NULL AND approval_document_reference IS NULL AND approved_at IS NULL AND approved_by_user_id IS NULL) OR
        (status IN ('APPROVED', 'ARCHIVED') AND approval_document_number IS NOT NULL AND approval_document_date IS NOT NULL AND approval_document_reference IS NOT NULL AND approved_at IS NOT NULL AND approved_by_user_id IS NOT NULL)
    )
);

CREATE INDEX idx_admission_policy_program_year_status
    ON distance_admission_policies(program_id, academic_year, status);
