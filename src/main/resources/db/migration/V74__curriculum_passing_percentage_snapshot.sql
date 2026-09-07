ALTER TABLE program_curriculum_versions ADD COLUMN passing_percentage DOUBLE PRECISION;
UPDATE program_curriculum_versions p
SET passing_percentage = p.passing_score * 100.0 / r.max_score
FROM rating_systems r
WHERE p.rating_system_id = r.id AND p.status IN ('APPROVED', 'ARCHIVED') AND r.max_score > 0;
ALTER TABLE program_curriculum_versions ADD CONSTRAINT ck_curriculum_passing_percentage
    CHECK (passing_percentage BETWEEN 0 AND 100);
