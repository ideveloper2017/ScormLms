ALTER TABLE subject_syllabi ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'DRAFT';
ALTER TABLE subject_syllabi ADD COLUMN revision_number INTEGER NOT NULL DEFAULT 1;
ALTER TABLE subject_syllabi ADD CONSTRAINT ck_syllabus_status CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED'));
CREATE TABLE subject_syllabus_revisions (
    id BIGSERIAL PRIMARY KEY,
    syllabus_id BIGINT NOT NULL REFERENCES subject_syllabi(id),
    revision_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    approved_by_name VARCHAR(255) NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    UNIQUE (syllabus_id, revision_number)
);
