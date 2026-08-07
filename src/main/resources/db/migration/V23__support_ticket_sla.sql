CREATE TABLE IF NOT EXISTS support_tickets (
    id BIGSERIAL PRIMARY KEY,
    ticket_code VARCHAR(40) NOT NULL UNIQUE,
    requester_user_id BIGINT NOT NULL REFERENCES users(id),
    assignee_user_id BIGINT REFERENCES users(id),
    course_id BIGINT REFERENCES courses(id),
    subject VARCHAR(250) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(30) NOT NULL,
    impact VARCHAR(30) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    sla_policy_version VARCHAR(20) NOT NULL,
    response_due_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolution_due_at TIMESTAMP WITH TIME ZONE NOT NULL,
    first_responded_at TIMESTAMP WITH TIME ZONE,
    sla_paused_at TIMESTAMP WITH TIME ZONE,
    sla_paused_seconds BIGINT NOT NULL DEFAULT 0,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_summary TEXT,
    closed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_support_ticket_category CHECK (category IN ('TECHNICAL', 'ACCESS', 'CONTENT', 'ASSESSMENT', 'OTHER')),
    CONSTRAINT ck_support_ticket_impact CHECK (impact IN ('LIMITED', 'MULTIPLE_USERS', 'SERVICE_BLOCKED', 'SECURITY')),
    CONSTRAINT ck_support_ticket_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    CONSTRAINT ck_support_ticket_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'WAITING_REQUESTER', 'RESOLVED', 'CLOSED', 'CANCELLED')),
    CONSTRAINT ck_support_ticket_deadlines CHECK (resolution_due_at > response_due_at),
    CONSTRAINT ck_support_ticket_resolution CHECK (
        (status IN ('RESOLVED', 'CLOSED') AND resolved_at IS NOT NULL AND resolution_summary IS NOT NULL)
        OR status NOT IN ('RESOLVED', 'CLOSED')
    ),
    CONSTRAINT ck_support_ticket_closed CHECK (closed_at IS NULL OR status = 'CLOSED'),
    CONSTRAINT ck_support_ticket_cancelled CHECK (cancelled_at IS NULL OR status = 'CANCELLED')
);

CREATE TABLE IF NOT EXISTS support_ticket_events (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES support_tickets(id),
    sequence_no INTEGER NOT NULL,
    actor_user_id BIGINT NOT NULL REFERENCES users(id),
    event_type VARCHAR(30) NOT NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    body TEXT,
    from_status VARCHAR(30),
    to_status VARCHAR(30),
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_support_ticket_event_sequence UNIQUE (ticket_id, sequence_no),
    CONSTRAINT ck_support_ticket_event_type CHECK (event_type IN ('CREATED', 'ASSIGNED', 'COMMENT', 'STATUS_CHANGED', 'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED')),
    CONSTRAINT ck_support_ticket_event_visibility CHECK (visibility IN ('PUBLIC', 'INTERNAL'))
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_requester_status ON support_tickets(requester_user_id, status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_assignee_status ON support_tickets(assignee_user_id, status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_sla ON support_tickets(status, response_due_at, resolution_due_at);
CREATE INDEX IF NOT EXISTS idx_support_ticket_event_ticket ON support_ticket_events(ticket_id, sequence_no);
