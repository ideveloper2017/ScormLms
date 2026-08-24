CREATE TABLE universities (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    rector VARCHAR(250) NOT NULL,
    address VARCHAR(1000) NOT NULL,
    default_language VARCHAR(30) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    bank_details TEXT NOT NULL,
    chief_accountant VARCHAR(250) NOT NULL,
    legal_counsel VARCHAR(250) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uq_universities_name UNIQUE(name),
    CONSTRAINT ck_universities_default_language CHECK(default_language IN ('EN', 'UZ_LATIN', 'KAA', 'RU', 'UZ_CYRILLIC'))
);

CREATE INDEX idx_universities_active_name ON universities(deleted, active, name);
