ALTER TABLE programs ADD COLUMN IF NOT EXISTS full_time_duration_months INTEGER;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS distance_duration_months INTEGER;

ALTER TABLE programs ADD CONSTRAINT ck_program_full_time_duration
    CHECK (full_time_duration_months IS NULL OR full_time_duration_months BETWEEN 1 AND 120);
ALTER TABLE programs ADD CONSTRAINT ck_program_distance_duration
    CHECK (distance_duration_months IS NULL OR distance_duration_months BETWEEN 1 AND 120);
ALTER TABLE programs ADD CONSTRAINT ck_program_duration_order
    CHECK (
        full_time_duration_months IS NULL
        OR distance_duration_months IS NULL
        OR distance_duration_months >= full_time_duration_months
    );
