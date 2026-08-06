ALTER TABLE course_contents ADD COLUMN IF NOT EXISTS language_code VARCHAR(35);
ALTER TABLE course_contents ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);
ALTER TABLE course_contents ADD COLUMN IF NOT EXISTS content_version VARCHAR(64);
ALTER TABLE course_contents ADD COLUMN IF NOT EXISTS source_name VARCHAR(500);
ALTER TABLE course_contents ADD COLUMN IF NOT EXISTS source_url VARCHAR(2000);
ALTER TABLE course_contents ADD COLUMN IF NOT EXISTS valid_from DATE;
ALTER TABLE course_contents ADD COLUMN IF NOT EXISTS valid_until DATE;
ALTER TABLE course_contents ADD COLUMN IF NOT EXISTS metadata_updated_at TIMESTAMP WITH TIME ZONE;

UPDATE course_contents cc
SET language_code = COALESCE(
        (SELECT NULLIF(TRIM(c.language), '')
           FROM course_modules cm
           JOIN courses c ON c.id = cm.course_id
          WHERE cm.id = cc.module_id),
        'und'
    ),
    author_name = COALESCE(
        (SELECT COALESCE(NULLIF(TRIM(u.full_name), ''), NULLIF(TRIM(u.username), ''))
           FROM course_modules cm
           JOIN courses c ON c.id = cm.course_id
           LEFT JOIN users u ON u.id = c.user_id
          WHERE cm.id = cc.module_id),
        'Aniqlanmagan legacy muallif'
    ),
    content_version = 'legacy-' || CAST(cc.id AS VARCHAR),
    source_name = 'LMS legacy record #' || CAST(cc.id AS VARCHAR),
    source_url = cc.content_url,
    valid_from = CAST(COALESCE(cc.published_at, cc.created_at, CURRENT_TIMESTAMP) AS DATE),
    metadata_updated_at = COALESCE(cc.updated_at, cc.created_at, CURRENT_TIMESTAMP)
WHERE cc.language_code IS NULL;

ALTER TABLE course_contents ALTER COLUMN language_code SET NOT NULL;
ALTER TABLE course_contents ALTER COLUMN author_name SET NOT NULL;
ALTER TABLE course_contents ALTER COLUMN content_version SET NOT NULL;
ALTER TABLE course_contents ALTER COLUMN source_name SET NOT NULL;
ALTER TABLE course_contents ALTER COLUMN valid_from SET NOT NULL;
ALTER TABLE course_contents ALTER COLUMN metadata_updated_at SET NOT NULL;

ALTER TABLE course_contents ADD CONSTRAINT IF NOT EXISTS ck_course_content_validity
    CHECK (valid_until IS NULL OR valid_until >= valid_from);

CREATE TABLE IF NOT EXISTS course_content_revisions (
    id BIGSERIAL PRIMARY KEY,
    content_id BIGINT NOT NULL REFERENCES course_contents(id),
    revision_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(20) NOT NULL,
    content_url VARCHAR(2000),
    duration_minutes INTEGER,
    language_code VARCHAR(35) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    content_version VARCHAR(64) NOT NULL,
    source_name VARCHAR(500) NOT NULL,
    source_url VARCHAR(2000),
    valid_from DATE NOT NULL,
    valid_until DATE,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    changed_by BIGINT NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_content_revision_number UNIQUE (content_id, revision_number),
    CONSTRAINT uk_content_revision_version UNIQUE (content_id, content_version),
    CONSTRAINT ck_content_revision_number CHECK (revision_number > 0),
    CONSTRAINT ck_content_revision_validity CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

INSERT INTO course_content_revisions (
    content_id, revision_number, title, description, content_type, content_url, duration_minutes,
    language_code, author_name, content_version, source_name, source_url, valid_from, valid_until,
    changed_at, changed_by, deleted, created_at, updated_at, created_by, updated_by
)
SELECT cc.id, 1, cc.title, cc.description, cc.content_type, cc.content_url, cc.duration_minutes,
       cc.language_code, cc.author_name, cc.content_version, cc.source_name, cc.source_url,
       cc.valid_from, cc.valid_until, cc.metadata_updated_at, COALESCE(cc.updated_by, cc.created_by, 0),
       FALSE, cc.created_at, cc.updated_at, cc.created_by, cc.updated_by
FROM course_contents cc
WHERE NOT EXISTS (SELECT 1 FROM course_content_revisions r WHERE r.content_id = cc.id);

CREATE INDEX IF NOT EXISTS idx_content_revision_time ON course_content_revisions(content_id, changed_at);
