ALTER TABLE course_contents ADD COLUMN IF NOT EXISTS review_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT';
ALTER TABLE course_contents ADD COLUMN IF NOT EXISTS approved_revision_number INTEGER;

-- Old content has no verifiable expert decision. It is deliberately unpublished
-- and must pass the new review workflow before students can access it again.
UPDATE course_contents
SET status = 'DRAFT', published_at = NULL, review_status = 'DRAFT', approved_revision_number = NULL
WHERE status = 'PUBLISHED';

ALTER TABLE course_contents ADD CONSTRAINT IF NOT EXISTS ck_course_content_review_status
    CHECK (review_status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'CHANGES_REQUESTED'));

CREATE TABLE IF NOT EXISTS course_content_reviews (
    id BIGSERIAL PRIMARY KEY,
    content_id BIGINT NOT NULL REFERENCES course_contents(id),
    revision_number INTEGER NOT NULL,
    content_version VARCHAR(64) NOT NULL,
    status VARCHAR(30) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    submitted_by BIGINT NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by BIGINT,
    decision_comment VARCHAR(2000),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_content_review_revision UNIQUE (content_id, revision_number),
    CONSTRAINT ck_content_review_revision CHECK (revision_number > 0),
    CONSTRAINT ck_content_review_status CHECK (status IN ('PENDING', 'APPROVED', 'CHANGES_REQUESTED')),
    CONSTRAINT ck_content_review_decision_fields CHECK (
        (status = 'PENDING' AND reviewed_at IS NULL AND reviewed_by IS NULL) OR
        (status <> 'PENDING' AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_content_review_queue ON course_content_reviews(status, submitted_at);
