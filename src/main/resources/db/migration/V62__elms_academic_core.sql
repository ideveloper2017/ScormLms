ALTER TABLE subject_categories ADD COLUMN name_en VARCHAR(200);
ALTER TABLE subject_categories ADD COLUMN name_ru VARCHAR(200);
ALTER TABLE subject_categories ADD COLUMN name_kaa VARCHAR(200);
ALTER TABLE subject_categories ADD COLUMN name_uz_cyrillic VARCHAR(200);

ALTER TABLE subjects ADD COLUMN name_en VARCHAR(500);
ALTER TABLE subjects ADD COLUMN name_ru VARCHAR(500);
ALTER TABLE subjects ADD COLUMN name_kaa VARCHAR(500);
ALTER TABLE subjects ADD COLUMN name_uz_cyrillic VARCHAR(500);
ALTER TABLE subjects ADD COLUMN subject_type VARCHAR(30);

CREATE TABLE subject_syllabi (
    id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT NOT NULL REFERENCES subjects(id),
    name VARCHAR(500) NOT NULL,
    language VARCHAR(20) NOT NULL,
    short_description VARCHAR(2000) NOT NULL,
    requirements TEXT,
    full_description TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uq_subject_syllabus_language UNIQUE(subject_id, language, name)
);
CREATE INDEX idx_subject_syllabi_subject_state ON subject_syllabi(subject_id, active, deleted);

CREATE TABLE curriculum_semester_periods (
    id BIGSERIAL PRIMARY KEY,
    curriculum_version_id BIGINT NOT NULL REFERENCES program_curriculum_versions(id),
    semester_number INTEGER NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    starts_on DATE NOT NULL,
    ends_on DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uq_curriculum_semester_period UNIQUE(curriculum_version_id, semester_number),
    CONSTRAINT ck_curriculum_semester_number CHECK(semester_number BETWEEN 1 AND 12),
    CONSTRAINT ck_curriculum_semester_dates CHECK(ends_on > starts_on)
);
CREATE INDEX idx_curriculum_semester_period_scope ON curriculum_semester_periods(curriculum_version_id, active, deleted);

CREATE TABLE curriculum_student_assignments (
    id BIGSERIAL PRIMARY KEY,
    curriculum_version_id BIGINT NOT NULL REFERENCES program_curriculum_versions(id),
    student_id BIGINT NOT NULL REFERENCES students(id),
    academic_year VARCHAR(20) NOT NULL,
    semester_number INTEGER NOT NULL,
    starts_on DATE NOT NULL,
    ends_on DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uq_curriculum_student_semester UNIQUE(curriculum_version_id, student_id, semester_number),
    CONSTRAINT ck_curriculum_student_semester CHECK(semester_number BETWEEN 1 AND 12),
    CONSTRAINT ck_curriculum_student_dates CHECK(ends_on > starts_on)
);
CREATE INDEX idx_curriculum_student_assignment_scope ON curriculum_student_assignments(curriculum_version_id, semester_number, active, deleted);
CREATE INDEX idx_curriculum_student_assignment_student ON curriculum_student_assignments(student_id, academic_year, semester_number);
