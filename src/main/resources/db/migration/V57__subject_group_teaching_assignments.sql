-- Operational teaching scope: an instructor is assigned to an approved
-- curriculum subject group, and new LMS courses bind to that exact scope.
CREATE TABLE academic_subject_group_teacher_assignments (
    id BIGSERIAL PRIMARY KEY,
    subject_group_id BIGINT NOT NULL REFERENCES academic_subject_groups(id),
    teacher_id BIGINT NOT NULL REFERENCES teachers(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_academic_subject_group_teacher UNIQUE (subject_group_id, teacher_id)
);

CREATE INDEX idx_academic_subject_group_teacher_user
    ON academic_subject_group_teacher_assignments(teacher_id, active);

ALTER TABLE courses
    ADD COLUMN subject_group_id BIGINT REFERENCES academic_subject_groups(id);

CREATE INDEX idx_course_subject_group
    ON courses(subject_group_id);
