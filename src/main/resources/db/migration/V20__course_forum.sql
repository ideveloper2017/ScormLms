CREATE TABLE IF NOT EXISTS course_forum_topics (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    author_id BIGINT NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    reply_count INTEGER NOT NULL DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status_updated_at TIMESTAMP WITH TIME ZONE,
    status_updated_by BIGINT REFERENCES users(id),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_forum_topic_status CHECK (status IN ('OPEN', 'LOCKED', 'ARCHIVED')),
    CONSTRAINT ck_forum_topic_reply_count CHECK (reply_count >= 0)
);

CREATE TABLE IF NOT EXISTS course_forum_posts (
    id BIGSERIAL PRIMARY KEY,
    topic_id BIGINT NOT NULL REFERENCES course_forum_topics(id),
    author_id BIGINT NOT NULL REFERENCES users(id),
    reply_to_id BIGINT REFERENCES course_forum_posts(id),
    body TEXT NOT NULL,
    revision_number INTEGER NOT NULL DEFAULT 1,
    edited_at TIMESTAMP WITH TIME ZONE,
    edited_by BIGINT REFERENCES users(id),
    hidden_at TIMESTAMP WITH TIME ZONE,
    hidden_by BIGINT REFERENCES users(id),
    hidden_reason VARCHAR(1000),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_forum_post_revision CHECK (revision_number > 0),
    CONSTRAINT ck_forum_post_hidden CHECK (
        (hidden_at IS NULL AND hidden_by IS NULL AND hidden_reason IS NULL)
        OR
        (hidden_at IS NOT NULL AND hidden_by IS NOT NULL AND hidden_reason IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS course_forum_post_revisions (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES course_forum_posts(id),
    revision_number INTEGER NOT NULL,
    body TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    changed_by BIGINT NOT NULL REFERENCES users(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_forum_post_revision UNIQUE (post_id, revision_number),
    CONSTRAINT ck_forum_post_revision_number CHECK (revision_number > 0)
);

CREATE INDEX IF NOT EXISTS idx_forum_topic_course_activity
    ON course_forum_topics(course_id, pinned, last_activity_at);
CREATE INDEX IF NOT EXISTS idx_forum_post_topic_created
    ON course_forum_posts(topic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_forum_post_reply_to
    ON course_forum_posts(reply_to_id);
