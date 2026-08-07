CREATE TABLE distance_program_restriction_catalogs (
    id BIGSERIAL PRIMARY KEY,
    catalog_year INTEGER NOT NULL,
    version_code VARCHAR(100) NOT NULL,
    authority_name VARCHAR(500) NOT NULL,
    document_number VARCHAR(200) NOT NULL,
    document_date DATE NOT NULL,
    publication_date DATE NOT NULL,
    document_reference VARCHAR(1000) NOT NULL,
    scope_note VARCHAR(2000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    published_at TIMESTAMP WITH TIME ZONE,
    published_by_user_id BIGINT REFERENCES users(id),
    verification_note VARCHAR(2000),
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_distance_restriction_year_version UNIQUE (catalog_year, version_code),
    CONSTRAINT ck_distance_restriction_year CHECK (catalog_year >= 2022),
    CONSTRAINT ck_distance_restriction_dates CHECK (document_date <= publication_date),
    CONSTRAINT ck_distance_restriction_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    CONSTRAINT ck_distance_restriction_publish_fields CHECK (
        (status = 'DRAFT' AND published_at IS NULL AND published_by_user_id IS NULL AND verification_note IS NULL) OR
        (status IN ('PUBLISHED', 'ARCHIVED') AND published_at IS NOT NULL AND published_by_user_id IS NOT NULL AND verification_note IS NOT NULL)
    ),
    CONSTRAINT ck_distance_restriction_archive_fields CHECK (
        (status <> 'ARCHIVED' AND archived_at IS NULL AND archived_by_user_id IS NULL) OR
        (status = 'ARCHIVED' AND archived_at IS NOT NULL AND archived_by_user_id IS NOT NULL)
    )
);

CREATE INDEX idx_distance_restriction_year_status
    ON distance_program_restriction_catalogs(catalog_year, status);

CREATE TABLE distance_program_restriction_entries (
    id BIGSERIAL PRIMARY KEY,
    catalog_id BIGINT NOT NULL REFERENCES distance_program_restriction_catalogs(id),
    program_code VARCHAR(100) NOT NULL,
    program_name VARCHAR(500) NOT NULL,
    degree_level VARCHAR(20) NOT NULL,
    reason VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_distance_restriction_entry UNIQUE (catalog_id, program_code, degree_level),
    CONSTRAINT ck_distance_restriction_degree CHECK (degree_level IN ('BACHELOR', 'MASTER'))
);

CREATE INDEX idx_distance_restriction_entry_lookup
    ON distance_program_restriction_entries(program_code, degree_level);
