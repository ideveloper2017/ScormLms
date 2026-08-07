CREATE TABLE student_lifecycle_events (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id),
    event_type VARCHAR(20) NOT NULL,
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    from_program_id BIGINT REFERENCES programs(id),
    to_program_id BIGINT REFERENCES programs(id),
    from_program_name_snapshot VARCHAR(500),
    to_program_name_snapshot VARCHAR(500),
    from_group_id BIGINT,
    to_group_id BIGINT,
    order_number VARCHAR(200) NOT NULL,
    order_date DATE NOT NULL,
    effective_date DATE NOT NULL,
    legal_basis VARCHAR(1000) NOT NULL,
    reason VARCHAR(2000) NOT NULL,
    recorded_by_user_id BIGINT NOT NULL REFERENCES users(id),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_student_lifecycle_order UNIQUE (student_id, event_type, order_number),
    CONSTRAINT ck_student_lifecycle_type CHECK (
        event_type IN ('ADMISSION', 'SUSPENSION', 'REINSTATEMENT', 'TRANSFER', 'EXPULSION', 'GRADUATION')
    ),
    CONSTRAINT ck_student_lifecycle_from_status CHECK (
        from_status IS NULL OR from_status IN ('ACTIVE', 'SUSPENDED', 'EXPELLED', 'GRADUATED')
    ),
    CONSTRAINT ck_student_lifecycle_to_status CHECK (
        to_status IN ('ACTIVE', 'SUSPENDED', 'EXPELLED', 'GRADUATED')
    ),
    CONSTRAINT ck_student_lifecycle_dates CHECK (effective_date >= order_date)
);

CREATE INDEX idx_student_lifecycle_student_time
    ON student_lifecycle_events(student_id, effective_date DESC, recorded_at DESC);
CREATE INDEX idx_student_lifecycle_order
    ON student_lifecycle_events(order_number, order_date);
CREATE INDEX idx_student_lifecycle_actor
    ON student_lifecycle_events(recorded_by_user_id, recorded_at DESC);
