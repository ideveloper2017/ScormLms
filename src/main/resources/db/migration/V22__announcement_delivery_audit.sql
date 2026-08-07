CREATE TABLE IF NOT EXISTS announcements (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(250) NOT NULL,
    body TEXT NOT NULL,
    audience_type VARCHAR(20) NOT NULL,
    course_id BIGINT REFERENCES courses(id),
    category VARCHAR(20) NOT NULL,
    priority VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    channels VARCHAR(100) NOT NULL,
    action_url VARCHAR(500),
    author_user_id BIGINT NOT NULL REFERENCES users(id),
    published_at TIMESTAMP WITH TIME ZONE,
    published_by_user_id BIGINT REFERENCES users(id),
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by_user_id BIGINT REFERENCES users(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_announcement_audience CHECK (audience_type IN ('COURSE', 'INSTITUTION')),
    CONSTRAINT ck_announcement_category CHECK (category IN ('INFORMATION', 'DEADLINE', 'EVENT', 'WARNING')),
    CONSTRAINT ck_announcement_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    CONSTRAINT ck_announcement_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    CONSTRAINT ck_announcement_course_scope CHECK (
        (audience_type = 'COURSE' AND course_id IS NOT NULL)
        OR (audience_type = 'INSTITUTION' AND course_id IS NULL)
    ),
    CONSTRAINT ck_announcement_lifecycle CHECK (
        (status = 'DRAFT' AND published_at IS NULL AND published_by_user_id IS NULL AND archived_at IS NULL AND archived_by_user_id IS NULL)
        OR (status = 'PUBLISHED' AND published_at IS NOT NULL AND published_by_user_id IS NOT NULL AND archived_at IS NULL AND archived_by_user_id IS NULL)
        OR (status = 'ARCHIVED' AND archived_at IS NOT NULL AND archived_by_user_id IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS announcement_deliveries (
    id BIGSERIAL PRIMARY KEY,
    announcement_id BIGINT NOT NULL REFERENCES announcements(id),
    recipient_user_id BIGINT NOT NULL REFERENCES users(id),
    channel VARCHAR(20) NOT NULL,
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    destination_masked VARCHAR(250),
    provider_reference VARCHAR(250),
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    last_error VARCHAR(1000),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_announcement_delivery UNIQUE (announcement_id, recipient_user_id, channel),
    CONSTRAINT ck_announcement_delivery_channel CHECK (channel IN ('IN_APP', 'EMAIL', 'PUSH')),
    CONSTRAINT ck_announcement_delivery_status CHECK (delivery_status IN ('PENDING', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED')),
    CONSTRAINT ck_announcement_delivery_attempts CHECK (attempt_count >= 0 AND attempt_count <= 5),
    CONSTRAINT ck_announcement_delivery_read CHECK (read_at IS NULL OR (channel = 'IN_APP' AND delivery_status = 'READ'))
);

CREATE INDEX IF NOT EXISTS idx_announcement_author_status ON announcements(author_user_id, status);
CREATE INDEX IF NOT EXISTS idx_announcement_course_status ON announcements(course_id, status);
CREATE INDEX IF NOT EXISTS idx_announcement_delivery_recipient ON announcement_deliveries(recipient_user_id, channel, delivery_status);
CREATE INDEX IF NOT EXISTS idx_announcement_delivery_retry ON announcement_deliveries(announcement_id, delivery_status, attempt_count);
