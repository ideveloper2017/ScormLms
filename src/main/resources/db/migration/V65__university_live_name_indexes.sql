ALTER TABLE universities DROP CONSTRAINT uq_universities_name;
DROP INDEX idx_universities_active_name;

CREATE UNIQUE INDEX uq_universities_live_name
    ON universities(LOWER(name))
    WHERE deleted = FALSE;

CREATE INDEX idx_universities_state_name
    ON universities(deleted, active, name);
