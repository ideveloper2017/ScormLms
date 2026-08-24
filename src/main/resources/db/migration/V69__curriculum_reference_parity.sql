-- Control eLMS curriculum edit-form parity.
-- Faculty is intentionally derived through program -> department -> faculty,
-- so the curriculum does not duplicate organisational ownership.
ALTER TABLE program_curriculum_versions
    ADD COLUMN name VARCHAR(500) NOT NULL DEFAULT 'O''quv reja';

ALTER TABLE program_curriculum_versions
    ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE program_curriculum_versions
    ADD COLUMN education_language VARCHAR(20) NOT NULL DEFAULT 'uz';

ALTER TABLE program_curriculum_versions
    ADD COLUMN passing_score INTEGER NOT NULL DEFAULT 60;

ALTER TABLE program_curriculum_versions
    ADD COLUMN base_credit_amount BIGINT NOT NULL DEFAULT 0;

ALTER TABLE program_curriculum_versions
    ADD COLUMN education_form VARCHAR(30) NOT NULL DEFAULT 'DISTANCE';

ALTER TABLE program_curriculum_versions
    ADD COLUMN rating_system_id BIGINT;

ALTER TABLE program_curriculum_versions
    ADD COLUMN semester_count INTEGER NOT NULL DEFAULT 8;

UPDATE program_curriculum_versions pcv
SET name = (
        SELECT p.name || ' (' || SUBSTRING(pcv.academic_year, 1, 4) || '_' || p.education_language || ')'
        FROM programs p
        WHERE p.id = pcv.program_id
    ),
    education_language = (
        SELECT CASE WHEN p.education_language = 'uz' THEN 'uz-Latn' ELSE p.education_language END
        FROM programs p
        WHERE p.id = pcv.program_id
    ),
    education_form = (
        SELECT CASE WHEN p.distance_enabled = TRUE THEN 'DISTANCE' ELSE 'FULL_TIME' END
        FROM programs p
        WHERE p.id = pcv.program_id
    ),
    rating_system_id = (
        SELECT MIN(rs.id)
        FROM rating_systems rs
        WHERE rs.deleted = FALSE AND rs.active = TRUE
    );

ALTER TABLE program_curriculum_versions
    ALTER COLUMN rating_system_id SET NOT NULL;

ALTER TABLE program_curriculum_versions
    ADD CONSTRAINT fk_curriculum_rating_system
        FOREIGN KEY (rating_system_id) REFERENCES rating_systems(id);

ALTER TABLE program_curriculum_versions
    ADD CONSTRAINT ck_curriculum_passing_score
        CHECK (passing_score BETWEEN 0 AND 100);

ALTER TABLE program_curriculum_versions
    ADD CONSTRAINT ck_curriculum_base_credit_amount
        CHECK (base_credit_amount >= 0);

ALTER TABLE program_curriculum_versions
    ADD CONSTRAINT ck_curriculum_education_form
        CHECK (education_form IN ('FULL_TIME', 'PART_TIME', 'EVENING', 'DISTANCE'));

ALTER TABLE program_curriculum_versions
    ADD CONSTRAINT ck_curriculum_semester_count
        CHECK (semester_count BETWEEN 1 AND 15);

CREATE INDEX idx_curriculum_reference_filters
    ON program_curriculum_versions(active, education_language, education_form, rating_system_id);
