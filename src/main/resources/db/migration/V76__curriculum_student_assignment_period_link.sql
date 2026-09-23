-- Additive-only step: link each student assignment to the exact semester
-- period row it already duplicates (academic_year/starts_on/ends_on), instead
-- of only match-joining on (curriculum_version_id, semester_number) at query
-- time. Nothing is dropped or renamed here -- the existing duplicate columns
-- stay as-is and keep being read/written by the app; this only adds a new,
-- nullable, backfilled reference that new code can start relying on.
ALTER TABLE curriculum_student_assignments
    ADD COLUMN period_id BIGINT REFERENCES curriculum_semester_periods(id);

UPDATE curriculum_student_assignments a
SET period_id = p.id
FROM curriculum_semester_periods p
WHERE p.curriculum_version_id = a.curriculum_version_id
  AND p.semester_number = a.semester_number;

CREATE INDEX idx_curriculum_student_assignment_period ON curriculum_student_assignments(period_id);
