CREATE TABLE re_reading_plans (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    application_deadline DATE NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_re_reading_plan_status CHECK (status IN ('PLANNED', 'OPEN', 'CLOSED'))
);
CREATE INDEX idx_re_reading_plans_state ON re_reading_plans(status, application_deadline, deleted);

CREATE TABLE re_reading_applications (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL REFERENCES re_reading_plans(id),
    student_id BIGINT NOT NULL REFERENCES students(id),
    contract_number VARCHAR(100) NOT NULL,
    total_credits INTEGER NOT NULL DEFAULT 0,
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    submitted_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_re_reading_application_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
    CONSTRAINT ck_re_reading_credits CHECK (total_credits BETWEEN 0 AND 300),
    CONSTRAINT ck_re_reading_amounts CHECK (total_amount >= 0 AND paid_amount >= 0 AND paid_amount <= total_amount)
);
CREATE UNIQUE INDEX uq_re_reading_application_student_plan ON re_reading_applications(plan_id, student_id) WHERE deleted = FALSE;
CREATE UNIQUE INDEX uq_re_reading_contract ON re_reading_applications(LOWER(contract_number)) WHERE deleted = FALSE;
CREATE INDEX idx_re_reading_application_state ON re_reading_applications(status, student_id, deleted);

CREATE TABLE tutor_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    code VARCHAR(60) NOT NULL,
    faculty_id BIGINT REFERENCES faculties(id),
    tutor_id BIGINT REFERENCES teachers(id),
    name_uz VARCHAR(180),
    name_ru VARCHAR(180),
    name_en VARCHAR(180),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);
CREATE UNIQUE INDEX uq_tutor_groups_code ON tutor_groups(LOWER(code)) WHERE deleted = FALSE;
CREATE INDEX idx_tutor_groups_faculty ON tutor_groups(faculty_id, active, deleted);
