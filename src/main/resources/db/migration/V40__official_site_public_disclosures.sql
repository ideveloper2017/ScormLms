CREATE TABLE official_site_publications (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(40) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    version_code VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    summary VARCHAR(10000) NOT NULL,
    source_document_number VARCHAR(200) NOT NULL,
    source_document_date DATE NOT NULL,
    source_reference VARCHAR(1000) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
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
    CONSTRAINT uq_official_site_publication_version UNIQUE (slug, version_code),
    CONSTRAINT uq_official_site_publication_current UNIQUE (slug, published_slot),
    CONSTRAINT ck_official_site_publication_category CHECK (
        category IN ('CHARTER_OR_STATUTE', 'CURRICULA_AND_PROGRAMS', 'TEACHING_STAFF', 'ACADEMIC_CALENDAR')
    ),
    CONSTRAINT ck_official_site_publication_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'REJECTED', 'ARCHIVED')),
    CONSTRAINT ck_official_site_publication_effective CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT ck_official_site_publication_slot CHECK (
        (status = 'PUBLISHED' AND published_slot = 1) OR (status <> 'PUBLISHED' AND published_slot IS NULL)
    ),
    CONSTRAINT ck_official_site_publication_review CHECK (
        (status = 'DRAFT' AND reviewed_at IS NULL AND reviewed_by_user_id IS NULL AND review_note IS NULL) OR
        (status IN ('PUBLISHED', 'REJECTED', 'ARCHIVED') AND reviewed_at IS NOT NULL AND reviewed_by_user_id IS NOT NULL AND review_note IS NOT NULL)
    ),
    CONSTRAINT ck_official_site_publication_archive CHECK (
        (status <> 'ARCHIVED' AND archived_at IS NULL AND archived_by_user_id IS NULL) OR
        (status = 'ARCHIVED' AND archived_at IS NOT NULL AND archived_by_user_id IS NOT NULL)
    )
);

CREATE INDEX idx_official_site_publication_status_category
    ON official_site_publications(status, category, effective_from, effective_to);

