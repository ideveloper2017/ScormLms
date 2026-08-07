CREATE TABLE content_standard_checklists (
    id BIGSERIAL PRIMARY KEY,
    standard_code VARCHAR(100) NOT NULL,
    version_code VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    issuing_authority VARCHAR(500) NOT NULL,
    source_document_number VARCHAR(200) NOT NULL,
    source_document_date DATE NOT NULL,
    source_reference VARCHAR(1000) NOT NULL,
    valid_from DATE NOT NULL,
    valid_until DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    published_slot SMALLINT,
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
    CONSTRAINT uq_content_standard_checklist_version UNIQUE (standard_code, version_code),
    CONSTRAINT uq_content_standard_checklist_current UNIQUE (published_slot),
    CONSTRAINT ck_content_standard_code CHECK (standard_code = 'O''ZDST 36.2030'),
    CONSTRAINT ck_content_standard_checklist_validity CHECK (valid_until IS NULL OR valid_until >= valid_from),
    CONSTRAINT ck_content_standard_checklist_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'REJECTED', 'ARCHIVED')),
    CONSTRAINT ck_content_standard_checklist_slot CHECK (
        (status = 'PUBLISHED' AND published_slot = 1) OR (status <> 'PUBLISHED' AND published_slot IS NULL)
    ),
    CONSTRAINT ck_content_standard_checklist_review CHECK (
        (status = 'DRAFT' AND reviewed_at IS NULL AND reviewed_by_user_id IS NULL AND review_note IS NULL) OR
        (status IN ('PUBLISHED', 'REJECTED', 'ARCHIVED') AND reviewed_at IS NOT NULL AND reviewed_by_user_id IS NOT NULL AND review_note IS NOT NULL)
    ),
    CONSTRAINT ck_content_standard_checklist_archive CHECK (
        (status <> 'ARCHIVED' AND archived_at IS NULL AND archived_by_user_id IS NULL) OR
        (status = 'ARCHIVED' AND archived_at IS NOT NULL AND archived_by_user_id IS NOT NULL)
    )
);

CREATE TABLE content_standard_criteria (
    id BIGSERIAL PRIMARY KEY,
    checklist_id BIGINT NOT NULL REFERENCES content_standard_checklists(id),
    criterion_code VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description VARCHAR(4000) NOT NULL,
    required BOOLEAN NOT NULL DEFAULT TRUE,
    evidence_hint VARCHAR(1000),
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_content_standard_criterion UNIQUE (checklist_id, criterion_code),
    CONSTRAINT ck_content_standard_criterion_position CHECK (position > 0)
);

CREATE TABLE content_standard_assessments (
    id BIGSERIAL PRIMARY KEY,
    content_revision_id BIGINT NOT NULL REFERENCES course_content_revisions(id),
    checklist_id BIGINT NOT NULL REFERENCES content_standard_checklists(id),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by_user_id BIGINT REFERENCES users(id),
    review_note VARCHAR(2000),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_content_standard_assessment UNIQUE (content_revision_id, checklist_id),
    CONSTRAINT ck_content_standard_assessment_status CHECK (status IN ('DRAFT', 'PASSED', 'FAILED')),
    CONSTRAINT ck_content_standard_assessment_review CHECK (
        (status = 'DRAFT' AND reviewed_at IS NULL AND reviewed_by_user_id IS NULL AND review_note IS NULL) OR
        (status IN ('PASSED', 'FAILED') AND reviewed_at IS NOT NULL AND reviewed_by_user_id IS NOT NULL AND review_note IS NOT NULL)
    )
);

CREATE TABLE content_standard_assessment_responses (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL REFERENCES content_standard_assessments(id),
    criterion_id BIGINT NOT NULL REFERENCES content_standard_criteria(id),
    met BOOLEAN NOT NULL,
    evidence_reference VARCHAR(1000),
    note VARCHAR(2000),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_content_standard_assessment_response UNIQUE (assessment_id, criterion_id),
    CONSTRAINT ck_content_standard_response_detail CHECK (
        (met = TRUE AND evidence_reference IS NOT NULL) OR
        (met = FALSE AND note IS NOT NULL)
    )
);

CREATE INDEX idx_content_standard_checklist_status ON content_standard_checklists(status, valid_from, valid_until);
CREATE INDEX idx_content_standard_assessment_status ON content_standard_assessments(checklist_id, status);

