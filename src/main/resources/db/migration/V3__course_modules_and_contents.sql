CREATE TABLE IF NOT EXISTS course_modules (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_course_module_position CHECK (position > 0)
);
CREATE INDEX IF NOT EXISTS idx_course_module_order ON course_modules(course_id, position);

CREATE TABLE IF NOT EXISTS course_contents (
    id BIGSERIAL PRIMARY KEY,
    module_id BIGINT NOT NULL REFERENCES course_modules(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(20) NOT NULL,
    content_url VARCHAR(2000),
    duration_minutes INTEGER,
    position INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_course_content_position CHECK (position > 0),
    CONSTRAINT ck_course_content_duration CHECK (duration_minutes IS NULL OR duration_minutes >= 0)
);
CREATE INDEX IF NOT EXISTS idx_course_content_order ON course_contents(module_id, position);
