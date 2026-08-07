CREATE TABLE student_practice_placements (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id),
    academic_year VARCHAR(20) NOT NULL,
    plan_reference VARCHAR(500) NOT NULL,
    starts_on DATE NOT NULL,
    ends_on DATE NOT NULL,
    placement_basis VARCHAR(30) NOT NULL,
    organization_name VARCHAR(500) NOT NULL,
    organization_address VARCHAR(1000) NOT NULL,
    job_title VARCHAR(300),
    specialty_match_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    agreement_number VARCHAR(200),
    agreement_date DATE,
    basis_evidence_reference VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by_user_id BIGINT REFERENCES users(id),
    completion_summary TEXT,
    completion_evidence_reference VARCHAR(1000),
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by_user_id BIGINT REFERENCES users(id),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by_user_id BIGINT REFERENCES users(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_practice_period CHECK (ends_on >= starts_on),
    CONSTRAINT ck_practice_basis CHECK (placement_basis IN ('CURRENT_WORKPLACE', 'PARTNER_ORGANIZATION')),
    CONSTRAINT ck_practice_status CHECK (status IN ('DRAFT', 'APPROVED', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT ck_practice_basis_fields CHECK (
        (placement_basis = 'CURRENT_WORKPLACE' AND specialty_match_confirmed = TRUE AND job_title IS NOT NULL)
        OR
        (placement_basis = 'PARTNER_ORGANIZATION' AND agreement_number IS NOT NULL AND agreement_date IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_practice_student_period
    ON student_practice_placements(student_id, starts_on, ends_on);
CREATE INDEX IF NOT EXISTS idx_practice_status_year
    ON student_practice_placements(status, academic_year);
CREATE INDEX IF NOT EXISTS idx_practice_student_plan
    ON student_practice_placements(student_id, academic_year, plan_reference);
