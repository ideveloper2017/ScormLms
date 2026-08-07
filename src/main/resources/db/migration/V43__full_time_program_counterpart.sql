-- Decision 559, annex clause 3: a non-ICT distance program may operate only
-- when the corresponding full-time form exists at the institution.
-- Existing distance rows are left NULL deliberately: their evidence must be
-- supplied by an authorised academic user instead of being invented by a migration.
ALTER TABLE programs ADD COLUMN IF NOT EXISTS full_time_available BOOLEAN DEFAULT FALSE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS full_time_basis_reference VARCHAR(500);

UPDATE programs
SET full_time_available = NULL
WHERE distance_enabled = TRUE
  AND information_technology_program = FALSE
  AND (full_time_basis_reference IS NULL OR TRIM(full_time_basis_reference) = '');

ALTER TABLE programs ADD CONSTRAINT ck_program_full_time_basis
    CHECK (
        full_time_available IS NULL
        OR full_time_available = FALSE
        OR (full_time_basis_reference IS NOT NULL AND TRIM(full_time_basis_reference) <> '')
    );

ALTER TABLE programs ADD CONSTRAINT ck_program_distance_full_time_counterpart
    CHECK (
        distance_enabled = FALSE
        OR information_technology_program = TRUE
        OR full_time_available IS NULL
        OR full_time_available = TRUE
    );
