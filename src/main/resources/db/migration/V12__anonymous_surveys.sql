CREATE TABLE IF NOT EXISTS surveys (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description VARCHAR(2000) NOT NULL DEFAULT '',
    audience VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    min_aggregate_size INTEGER NOT NULL DEFAULT 5,
    anonymous_salt VARCHAR(64) NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_survey_audience CHECK (audience IN ('STUDENT', 'TEACHER', 'BOTH')),
    CONSTRAINT ck_survey_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED')),
    CONSTRAINT ck_survey_window CHECK (starts_at < ends_at),
    CONSTRAINT ck_survey_aggregate_size CHECK (min_aggregate_size BETWEEN 5 AND 100)
);

CREATE TABLE IF NOT EXISTS survey_questions (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL REFERENCES surveys(id),
    prompt VARCHAR(1000) NOT NULL,
    question_type VARCHAR(30) NOT NULL,
    option_values TEXT,
    required BOOLEAN NOT NULL DEFAULT TRUE,
    position INTEGER NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_survey_question_type CHECK (question_type IN ('RATING', 'SINGLE_CHOICE')),
    CONSTRAINT uq_survey_question_position UNIQUE (survey_id, position)
);

CREATE TABLE IF NOT EXISTS survey_responses (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL REFERENCES surveys(id),
    respondent_hash VARCHAR(64) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_survey_anonymous_response UNIQUE (survey_id, respondent_hash)
);

CREATE TABLE IF NOT EXISTS survey_answers (
    id BIGSERIAL PRIMARY KEY,
    response_id BIGINT NOT NULL REFERENCES survey_responses(id),
    question_id BIGINT NOT NULL REFERENCES survey_questions(id),
    rating_value INTEGER,
    option_value VARCHAR(500),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT ck_survey_rating CHECK (rating_value IS NULL OR rating_value BETWEEN 1 AND 5),
    CONSTRAINT uq_survey_response_answer UNIQUE (response_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_survey_status_window ON surveys(status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_survey_response_survey ON survey_responses(survey_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_survey_answer_question ON survey_answers(question_id);
