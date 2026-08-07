CREATE TABLE assessment_leave_evidence (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id),
    academic_year VARCHAR(20) NOT NULL,
    leave_purpose VARCHAR(40) NOT NULL,
    assessment_reference VARCHAR(1000) NOT NULL,
    employer_name VARCHAR(500) NOT NULL,
    job_title VARCHAR(300) NOT NULL,
    employment_document_reference VARCHAR(1000) NOT NULL,
    leave_order_number VARCHAR(200) NOT NULL,
    leave_order_date DATE NOT NULL,
    leave_start_date DATE NOT NULL,
    leave_end_date DATE NOT NULL,
    salary_retention_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    evidence_reference VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by_user_id BIGINT REFERENCES users(id),
    verification_note VARCHAR(2000),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejected_by_user_id BIGINT REFERENCES users(id),
    rejection_reason VARCHAR(2000),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_assessment_leave_purpose CHECK (leave_purpose IN ('SEMESTER_FINAL_ASSESSMENT', 'STATE_ATTESTATION', 'BACHELOR_THESIS_DEFENSE', 'MASTER_THESIS_DEFENSE')),
    CONSTRAINT ck_assessment_leave_status CHECK (status IN ('DRAFT', 'VERIFIED', 'REJECTED')),
    CONSTRAINT ck_assessment_leave_min_period CHECK (leave_end_date >= leave_start_date + 14),
    CONSTRAINT ck_assessment_leave_order_date CHECK (leave_order_date <= leave_start_date),
    CONSTRAINT ck_assessment_leave_workflow CHECK (
        (status = 'DRAFT' AND verified_at IS NULL AND verified_by_user_id IS NULL AND verification_note IS NULL AND rejected_at IS NULL AND rejected_by_user_id IS NULL AND rejection_reason IS NULL) OR
        (status = 'VERIFIED' AND verified_at IS NOT NULL AND verified_by_user_id IS NOT NULL AND verification_note IS NOT NULL AND rejected_at IS NULL AND rejected_by_user_id IS NULL AND rejection_reason IS NULL AND salary_retention_confirmed = TRUE) OR
        (status = 'REJECTED' AND verified_at IS NULL AND verified_by_user_id IS NULL AND verification_note IS NULL AND rejected_at IS NOT NULL AND rejected_by_user_id IS NOT NULL AND rejection_reason IS NOT NULL)
    )
);

CREATE INDEX idx_assessment_leave_student_year ON assessment_leave_evidence(student_id, academic_year);
CREATE INDEX idx_assessment_leave_status_period ON assessment_leave_evidence(status, leave_start_date, leave_end_date);
