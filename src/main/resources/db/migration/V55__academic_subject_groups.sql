-- UX-EDU-03B: subject groups are operational teaching groups, separate from
-- the student's primary academic cohort in study_groups.
CREATE TABLE academic_subject_groups (
    id BIGSERIAL PRIMARY KEY,
    curriculum_subject_id BIGINT NOT NULL REFERENCES program_curriculum_subjects(id),
    code VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 30,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_academic_subject_group_code UNIQUE (curriculum_subject_id, code),
    CONSTRAINT uq_academic_subject_group_scope_key UNIQUE (id, curriculum_subject_id),
    CONSTRAINT ck_academic_subject_group_capacity CHECK (capacity BETWEEN 1 AND 500)
);

CREATE INDEX idx_academic_subject_group_scope
    ON academic_subject_groups(curriculum_subject_id, active, deleted);

CREATE TABLE academic_subject_group_memberships (
    id BIGSERIAL PRIMARY KEY,
    subject_group_id BIGINT NOT NULL,
    curriculum_subject_id BIGINT NOT NULL REFERENCES program_curriculum_subjects(id),
    student_id BIGINT NOT NULL REFERENCES students(id),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_academic_subject_group_member UNIQUE (subject_group_id, student_id),
    CONSTRAINT uq_academic_subject_membership_student_subject UNIQUE (student_id, curriculum_subject_id),
    CONSTRAINT fk_academic_subject_membership_group_scope
        FOREIGN KEY (subject_group_id, curriculum_subject_id)
        REFERENCES academic_subject_groups(id, curriculum_subject_id)
);

CREATE INDEX idx_academic_subject_group_membership_student
    ON academic_subject_group_memberships(student_id);
