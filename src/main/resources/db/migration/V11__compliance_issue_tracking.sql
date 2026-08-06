CREATE TABLE IF NOT EXISTS compliance_issues (
    id BIGSERIAL PRIMARY KEY,
    violation_code VARCHAR(160) NOT NULL,
    clause VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(1000) NOT NULL,
    recommendation VARCHAR(2000) NOT NULL,
    remediation_plan VARCHAR(4000) NOT NULL,
    owner_id BIGINT NOT NULL REFERENCES users(id),
    due_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    resolution_evidence VARCHAR(4000),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by BIGINT REFERENCES users(id),
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by BIGINT REFERENCES users(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_compliance_issue_severity CHECK (severity IN ('CRITICAL', 'WARNING')),
    CONSTRAINT ck_compliance_issue_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'))
);

CREATE INDEX IF NOT EXISTS idx_compliance_issue_status_due ON compliance_issues(status, due_date);
CREATE INDEX IF NOT EXISTS idx_compliance_issue_owner_status ON compliance_issues(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_compliance_issue_violation ON compliance_issues(violation_code, status);
