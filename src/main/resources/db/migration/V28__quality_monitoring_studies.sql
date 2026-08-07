-- Decision 559, clause 30: observation, analysis, focus-group and interview evidence.
-- Participant identities are deliberately not stored; only aggregate scope and count are retained.
CREATE TABLE IF NOT EXISTS quality_monitoring_studies (
    id BIGSERIAL PRIMARY KEY,
    method VARCHAR(30) NOT NULL,
    title VARCHAR(500) NOT NULL,
    objective VARCHAR(2000) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    location_description VARCHAR(500) NOT NULL,
    population_scope VARCHAR(1000) NOT NULL,
    related_survey_id BIGINT REFERENCES surveys(id),
    facilitator_user_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    participant_count INTEGER,
    summary TEXT,
    findings TEXT,
    recommendations TEXT,
    evidence_reference VARCHAR(1000),
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by_user_id BIGINT REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by_user_id BIGINT REFERENCES users(id),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by_user_id BIGINT REFERENCES users(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_quality_study_method CHECK (method IN ('FOCUS_GROUP', 'INTERVIEW', 'OBSERVATION', 'DOCUMENT_ANALYSIS')),
    CONSTRAINT ck_quality_study_status CHECK (status IN ('DRAFT', 'COMPLETED', 'APPROVED', 'CANCELLED')),
    CONSTRAINT ck_quality_study_period CHECK (ends_at > starts_at),
    CONSTRAINT ck_quality_study_participants CHECK (participant_count IS NULL OR participant_count BETWEEN 0 AND 1000)
);

CREATE INDEX IF NOT EXISTS idx_quality_study_status_date
    ON quality_monitoring_studies(status, starts_at);
CREATE INDEX IF NOT EXISTS idx_quality_study_method_year
    ON quality_monitoring_studies(method, academic_year);
CREATE INDEX IF NOT EXISTS idx_quality_study_survey
    ON quality_monitoring_studies(related_survey_id);

