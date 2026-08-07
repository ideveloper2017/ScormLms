-- Decision 559, clause 21: the in-person LMS orientation, semester final
-- assessment and state attestation/defense requirements do not apply to a
-- student who is a citizen of a foreign state.

-- Correct the derived orientation flag without inventing completion evidence.
UPDATE students
SET lms_orientation_required = FALSE
WHERE education_form <> 'DISTANCE'
   OR citizenship <> 'UZBEKISTAN';

ALTER TABLE students ADD CONSTRAINT ck_student_lms_orientation_scope
    CHECK (
        lms_orientation_required = FALSE
        OR (education_form = 'DISTANCE' AND citizenship = 'UZBEKISTAN')
    );

-- Freeze the clause-21 applicability when the final-exam roster is published.
ALTER TABLE exam_attendance
    ADD COLUMN IF NOT EXISTS onsite_attendance_required BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE exam_attendance ea
SET onsite_attendance_required = FALSE
WHERE EXISTS (
    SELECT 1
    FROM course_enrollments ce
    JOIN students s ON s.id = ce.student_id
    WHERE ce.id = ea.enrollment_id
      AND s.citizenship <> 'UZBEKISTAN'
);

CREATE INDEX IF NOT EXISTS idx_exam_attendance_onsite_required
    ON exam_attendance(exam_session_id, onsite_attendance_required, attendance_status);

-- Freeze the same applicability for state attestation/bachelor/master defense.
-- Legacy DEFENDED rows intentionally retain a NULL confirmation timestamp: the
-- migration must not fabricate historical in-person attendance evidence.
ALTER TABLE student_defenses
    ADD COLUMN IF NOT EXISTS onsite_attendance_required BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_defenses
    ADD COLUMN IF NOT EXISTS onsite_attendance_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE student_defenses
    ADD COLUMN IF NOT EXISTS onsite_attendance_confirmed_by BIGINT REFERENCES users(id);

UPDATE student_defenses sd
SET onsite_attendance_required = FALSE
WHERE EXISTS (
    SELECT 1
    FROM course_enrollments ce
    JOIN students s ON s.id = ce.student_id
    WHERE ce.id = sd.enrollment_id
      AND s.citizenship <> 'UZBEKISTAN'
);

CREATE INDEX IF NOT EXISTS idx_student_defense_onsite_required
    ON student_defenses(attestation_session_id, onsite_attendance_required, onsite_attendance_confirmed_at);
