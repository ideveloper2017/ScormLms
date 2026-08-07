CREATE TABLE IF NOT EXISTS chat_conversations (
    id BIGSERIAL PRIMARY KEY,
    conversation_type VARCHAR(20) NOT NULL,
    title VARCHAR(200),
    direct_key VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    last_message_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by_user_id BIGINT REFERENCES users(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_chat_conversation_direct_key UNIQUE (direct_key),
    CONSTRAINT ck_chat_conversation_type CHECK (conversation_type IN ('DIRECT', 'GROUP')),
    CONSTRAINT ck_chat_conversation_status CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    CONSTRAINT ck_chat_conversation_shape CHECK (
        (conversation_type = 'DIRECT' AND direct_key IS NOT NULL AND title IS NULL)
        OR
        (conversation_type = 'GROUP' AND direct_key IS NULL AND title IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS chat_conversation_members (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES chat_conversations(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    member_role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    member_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL,
    left_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_chat_conversation_member UNIQUE (conversation_id, user_id),
    CONSTRAINT ck_chat_member_role CHECK (member_role IN ('OWNER', 'MEMBER')),
    CONSTRAINT ck_chat_member_status CHECK (member_status IN ('ACTIVE', 'LEFT')),
    CONSTRAINT ck_chat_member_left CHECK (
        (member_status = 'ACTIVE' AND left_at IS NULL)
        OR
        (member_status = 'LEFT' AND left_at IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES chat_conversations(id),
    sender_id BIGINT NOT NULL REFERENCES users(id),
    reply_to_id BIGINT REFERENCES chat_messages(id),
    body TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    hidden_at TIMESTAMP WITH TIME ZONE,
    hidden_by_user_id BIGINT REFERENCES users(id),
    hidden_reason VARCHAR(1000),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_chat_message_hidden CHECK (
        (hidden_at IS NULL AND hidden_by_user_id IS NULL AND hidden_reason IS NULL)
        OR
        (hidden_at IS NOT NULL AND hidden_by_user_id IS NOT NULL AND hidden_reason IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS chat_message_receipts (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES chat_messages(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    receipt_status VARCHAR(20) NOT NULL DEFAULT 'DELIVERED',
    delivered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_chat_message_receipt UNIQUE (message_id, user_id),
    CONSTRAINT ck_chat_receipt_status CHECK (receipt_status IN ('DELIVERED', 'READ')),
    CONSTRAINT ck_chat_receipt_read CHECK (
        (receipt_status = 'DELIVERED' AND read_at IS NULL)
        OR
        (receipt_status = 'READ' AND read_at IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_chat_conversation_activity ON chat_conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_chat_member_user_status ON chat_conversation_members(user_id, member_status);
CREATE INDEX IF NOT EXISTS idx_chat_message_conversation_sent ON chat_messages(conversation_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_chat_receipt_user_status ON chat_message_receipts(user_id, receipt_status);
