-- Rejadagi fan bo'lmagan qismlar: malakaviy amaliyot va yakuniy davlat attestatsiyasi (kredit, soat, hafta)
CREATE TABLE program_curriculum_components (
    id BIGSERIAL PRIMARY KEY,
    curriculum_version_id BIGINT NOT NULL REFERENCES program_curriculum_versions(id),
    component_type VARCHAR(30) NOT NULL,
    name VARCHAR(500) NOT NULL,
    semester INTEGER NOT NULL,
    credits INTEGER NOT NULL DEFAULT 0,
    hours INTEGER NOT NULL DEFAULT 0,
    weeks INTEGER,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_curriculum_component_type CHECK (component_type IN ('PRACTICE', 'STATE_ATTESTATION')),
    CONSTRAINT ck_curriculum_component_values CHECK (semester BETWEEN 1 AND 12 AND credits BETWEEN 0 AND 60
        AND hours BETWEEN 0 AND 5000 AND (weeks IS NULL OR weeks BETWEEN 0 AND 52))
);
CREATE INDEX idx_curriculum_components_version ON program_curriculum_components(curriculum_version_id);

-- "I. O'quv jarayoni jadvali": kurs bo'yicha 52 hafta kodlari (FT, A, T, M, B, G; bo'sh — nazariy ta'lim)
CREATE TABLE program_curriculum_schedule (
    id BIGSERIAL PRIMARY KEY,
    curriculum_version_id BIGINT NOT NULL REFERENCES program_curriculum_versions(id),
    course INTEGER NOT NULL,
    weeks VARCHAR(1000) NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_curriculum_schedule_course CHECK (course BETWEEN 1 AND 6)
);
CREATE UNIQUE INDEX uq_curriculum_schedule_course ON program_curriculum_schedule(curriculum_version_id, course) WHERE deleted = FALSE;

-- Kvalifikatsiya (masalan "Kompyuter tizimlari muhandisi")
ALTER TABLE program_curriculum_versions ADD COLUMN qualification VARCHAR(255);
