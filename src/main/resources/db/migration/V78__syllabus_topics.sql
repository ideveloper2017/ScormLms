-- Fan dasturi mavzulari: nazariy (ma'ruza) va amaliy mashg'ulotlarga bo'lingan
CREATE TABLE subject_syllabus_topics (
    id BIGSERIAL PRIMARY KEY,
    syllabus_id BIGINT NOT NULL REFERENCES subject_syllabi(id) ON DELETE CASCADE,
    topic_type VARCHAR(20) NOT NULL,
    sort_order INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    hours INTEGER NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_syllabus_topic_type CHECK (topic_type IN ('THEORETICAL', 'PRACTICAL')),
    CONSTRAINT ck_syllabus_topic_hours CHECK (hours > 0)
);
CREATE INDEX idx_subject_syllabus_topics_syllabus ON subject_syllabus_topics(syllabus_id, topic_type, sort_order);
