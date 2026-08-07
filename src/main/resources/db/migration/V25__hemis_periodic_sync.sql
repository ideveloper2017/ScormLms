ALTER TABLE students ADD COLUMN IF NOT EXISTS hemis_id BIGINT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS hemis_source_hash VARCHAR(128);
ALTER TABLE students ADD COLUMN IF NOT EXISTS hemis_synced_at TIMESTAMP WITH TIME ZONE;
CREATE UNIQUE INDEX IF NOT EXISTS uk_students_hemis_id ON students(hemis_id);

CREATE TABLE IF NOT EXISTS hemis_sync_runs (
    id BIGSERIAL PRIMARY KEY,
    trigger_type VARCHAR(20) NOT NULL,
    run_status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
    started_by_user_id BIGINT REFERENCES users(id),
    scope_group_id BIGINT,
    checkpoint_group_id BIGINT,
    checkpoint_offset INTEGER NOT NULL DEFAULT 0,
    groups_total INTEGER NOT NULL DEFAULT 0,
    groups_processed INTEGER NOT NULL DEFAULT 0,
    records_seen INTEGER NOT NULL DEFAULT 0,
    created_count INTEGER NOT NULL DEFAULT 0,
    updated_count INTEGER NOT NULL DEFAULT 0,
    unchanged_count INTEGER NOT NULL DEFAULT 0,
    conflict_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    last_error_code VARCHAR(100),
    last_error_message VARCHAR(1000),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_hemis_sync_run_trigger CHECK (trigger_type IN ('MANUAL', 'SCHEDULED')),
    CONSTRAINT ck_hemis_sync_run_status CHECK (run_status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED')),
    CONSTRAINT ck_hemis_sync_run_counts CHECK (
        checkpoint_offset >= 0 AND groups_total >= 0 AND groups_processed >= 0 AND records_seen >= 0
        AND created_count >= 0 AND updated_count >= 0 AND unchanged_count >= 0
        AND conflict_count >= 0 AND error_count >= 0
    )
);

CREATE TABLE IF NOT EXISTS hemis_sync_control (
    id BIGINT PRIMARY KEY,
    current_run_id BIGINT REFERENCES hemis_sync_runs(id),
    last_scheduled_at TIMESTAMP WITH TIME ZONE,
    version BIGINT NOT NULL DEFAULT 0
);
INSERT INTO hemis_sync_control(id, version) VALUES (1, 0);

CREATE TABLE IF NOT EXISTS hemis_group_mappings (
    id BIGSERIAL PRIMARY KEY,
    hemis_group_id BIGINT NOT NULL,
    hemis_group_name VARCHAR(250) NOT NULL,
    local_group_id BIGINT REFERENCES study_groups(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL,
    mapped_by_user_id BIGINT REFERENCES users(id),
    mapped_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_hemis_group_mapping UNIQUE (hemis_group_id)
);

CREATE TABLE IF NOT EXISTS hemis_sync_items (
    id BIGSERIAL PRIMARY KEY,
    run_id BIGINT NOT NULL REFERENCES hemis_sync_runs(id),
    hemis_student_id BIGINT NOT NULL,
    student_number VARCHAR(50) NOT NULL,
    source_hash VARCHAR(128) NOT NULL,
    item_outcome VARCHAR(20) NOT NULL,
    local_student_id BIGINT REFERENCES students(id),
    changed_fields VARCHAR(1000),
    error_code VARCHAR(100),
    error_message VARCHAR(1000),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_hemis_sync_item UNIQUE (run_id, hemis_student_id),
    CONSTRAINT ck_hemis_sync_item_outcome CHECK (item_outcome IN ('CREATED', 'UPDATED', 'UNCHANGED', 'CONFLICT', 'ERROR'))
);

CREATE TABLE IF NOT EXISTS hemis_sync_conflicts (
    id BIGSERIAL PRIMARY KEY,
    run_id BIGINT NOT NULL REFERENCES hemis_sync_runs(id),
    item_id BIGINT NOT NULL REFERENCES hemis_sync_items(id),
    local_student_id BIGINT REFERENCES students(id),
    conflict_code VARCHAR(100) NOT NULL,
    field_name VARCHAR(100),
    local_value_masked VARCHAR(500),
    source_value_masked VARCHAR(500),
    conflict_status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    resolution_note VARCHAR(1000),
    resolved_by_user_id BIGINT REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_hemis_sync_conflict_status CHECK (conflict_status IN ('OPEN', 'RESOLVED'))
);

CREATE INDEX IF NOT EXISTS idx_hemis_sync_run_status ON hemis_sync_runs(run_status, created_at);
CREATE INDEX IF NOT EXISTS idx_hemis_sync_item_run ON hemis_sync_items(run_id, item_outcome);
CREATE INDEX IF NOT EXISTS idx_hemis_sync_conflict_status ON hemis_sync_conflicts(conflict_status, created_at);
CREATE INDEX IF NOT EXISTS idx_hemis_group_mapping_local ON hemis_group_mappings(local_group_id, active);
