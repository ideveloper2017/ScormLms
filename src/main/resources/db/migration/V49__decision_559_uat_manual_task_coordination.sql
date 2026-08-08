CREATE TABLE decision_559_uat_manual_task_coordination (
    id BIGSERIAL PRIMARY KEY,
    run_id BIGINT NOT NULL REFERENCES decision_559_uat_runs(id),
    requirement_id VARCHAR(32) NOT NULL,
    band INTEGER NOT NULL,
    item_index INTEGER NOT NULL,
    assignee_name VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    note VARCHAR(2000) NOT NULL,
    coordinated_by BIGINT NOT NULL REFERENCES users(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uq_559_uat_manual_task_coord UNIQUE (run_id, requirement_id, item_index),
    CONSTRAINT ck_559_uat_manual_task_band CHECK (band IN (8, 9, 10, 11, 12, 14, 15, 16, 22, 25, 27, 28, 29, 33)),
    CONSTRAINT ck_559_uat_manual_task_index CHECK (item_index >= 0)
);

CREATE INDEX idx_559_uat_manual_task_run
    ON decision_559_uat_manual_task_coordination(run_id, band, item_index);

CREATE INDEX idx_559_uat_manual_task_due
    ON decision_559_uat_manual_task_coordination(deleted, due_date);
