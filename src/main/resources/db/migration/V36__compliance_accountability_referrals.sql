CREATE TABLE compliance_accountability_referrals (
    id BIGSERIAL PRIMARY KEY,
    compliance_issue_id BIGINT NOT NULL REFERENCES compliance_issues(id),
    review_subject_reference VARCHAR(1000) NOT NULL,
    competent_authority VARCHAR(500) NOT NULL,
    legal_basis VARCHAR(1000) NOT NULL,
    referral_number VARCHAR(200) NOT NULL,
    referral_date DATE NOT NULL,
    evidence_package_reference VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    referred_at TIMESTAMP WITH TIME ZONE,
    referred_by_user_id BIGINT REFERENCES users(id),
    referral_note VARCHAR(2000),
    decision_outcome VARCHAR(40),
    decision_authority VARCHAR(500),
    decision_number VARCHAR(200),
    decision_date DATE,
    decision_evidence_reference VARCHAR(1000),
    decision_summary VARCHAR(4000),
    decided_at TIMESTAMP WITH TIME ZONE,
    decided_by_user_id BIGINT REFERENCES users(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_accountability_authority_number UNIQUE (competent_authority, referral_number),
    CONSTRAINT ck_accountability_status CHECK (status IN ('DRAFT', 'REFERRED', 'DECIDED')),
    CONSTRAINT ck_accountability_outcome CHECK (decision_outcome IS NULL OR decision_outcome IN ('RESPONSIBILITY_ESTABLISHED', 'NO_RESPONSIBILITY_FOUND', 'PROCEEDING_TERMINATED')),
    CONSTRAINT ck_accountability_decision_date CHECK (decision_date IS NULL OR decision_date >= referral_date),
    CONSTRAINT ck_accountability_workflow CHECK (
        (status = 'DRAFT' AND referred_at IS NULL AND referred_by_user_id IS NULL AND referral_note IS NULL AND decision_outcome IS NULL AND decision_authority IS NULL AND decision_number IS NULL AND decision_date IS NULL AND decision_evidence_reference IS NULL AND decision_summary IS NULL AND decided_at IS NULL AND decided_by_user_id IS NULL) OR
        (status = 'REFERRED' AND referred_at IS NOT NULL AND referred_by_user_id IS NOT NULL AND referral_note IS NOT NULL AND decision_outcome IS NULL AND decision_authority IS NULL AND decision_number IS NULL AND decision_date IS NULL AND decision_evidence_reference IS NULL AND decision_summary IS NULL AND decided_at IS NULL AND decided_by_user_id IS NULL) OR
        (status = 'DECIDED' AND referred_at IS NOT NULL AND referred_by_user_id IS NOT NULL AND referral_note IS NOT NULL AND decision_outcome IS NOT NULL AND decision_authority IS NOT NULL AND decision_number IS NOT NULL AND decision_date IS NOT NULL AND decision_evidence_reference IS NOT NULL AND decision_summary IS NOT NULL AND decided_at IS NOT NULL AND decided_by_user_id IS NOT NULL)
    )
);

CREATE INDEX idx_accountability_issue_status ON compliance_accountability_referrals(compliance_issue_id, status);
CREATE INDEX idx_accountability_referral_date ON compliance_accountability_referrals(referral_date);
