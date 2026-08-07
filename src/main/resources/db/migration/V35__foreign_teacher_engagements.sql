CREATE TABLE foreign_teacher_engagements (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES teachers(id),
    academic_year VARCHAR(20) NOT NULL,
    citizenship_country_code VARCHAR(2) NOT NULL,
    citizenship_evidence_reference VARCHAR(1000) NOT NULL,
    qualification_reference VARCHAR(1000) NOT NULL,
    contract_number VARCHAR(200) NOT NULL,
    contract_date DATE NOT NULL,
    engagement_order_number VARCHAR(200) NOT NULL,
    engagement_order_date DATE NOT NULL,
    engagement_start_date DATE NOT NULL,
    engagement_end_date DATE NOT NULL,
    remote_teaching_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    evidence_reference VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by_user_id BIGINT REFERENCES users(id),
    verification_note VARCHAR(2000),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejected_by_user_id BIGINT REFERENCES users(id),
    rejection_reason VARCHAR(2000),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_foreign_teacher_country CHECK (citizenship_country_code = UPPER(citizenship_country_code) AND citizenship_country_code <> 'UZ' AND LENGTH(citizenship_country_code) = 2),
    CONSTRAINT ck_foreign_teacher_period CHECK (engagement_end_date >= engagement_start_date),
    CONSTRAINT ck_foreign_teacher_contract_date CHECK (contract_date <= engagement_start_date),
    CONSTRAINT ck_foreign_teacher_order_date CHECK (engagement_order_date <= engagement_start_date),
    CONSTRAINT ck_foreign_teacher_status CHECK (status IN ('DRAFT', 'VERIFIED', 'REJECTED')),
    CONSTRAINT ck_foreign_teacher_workflow CHECK (
        (status = 'DRAFT' AND verified_at IS NULL AND verified_by_user_id IS NULL AND verification_note IS NULL AND rejected_at IS NULL AND rejected_by_user_id IS NULL AND rejection_reason IS NULL) OR
        (status = 'VERIFIED' AND verified_at IS NOT NULL AND verified_by_user_id IS NOT NULL AND verification_note IS NOT NULL AND rejected_at IS NULL AND rejected_by_user_id IS NULL AND rejection_reason IS NULL AND remote_teaching_confirmed = TRUE) OR
        (status = 'REJECTED' AND verified_at IS NULL AND verified_by_user_id IS NULL AND verification_note IS NULL AND rejected_at IS NOT NULL AND rejected_by_user_id IS NOT NULL AND rejection_reason IS NOT NULL)
    )
);

CREATE TABLE foreign_teacher_engagement_courses (
    engagement_id BIGINT NOT NULL REFERENCES foreign_teacher_engagements(id) ON DELETE CASCADE,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    PRIMARY KEY (engagement_id, course_id)
);

CREATE INDEX idx_foreign_teacher_year_status ON foreign_teacher_engagements(academic_year, status);
CREATE INDEX idx_foreign_teacher_teacher_period ON foreign_teacher_engagements(teacher_id, engagement_start_date, engagement_end_date);
CREATE INDEX idx_foreign_teacher_course ON foreign_teacher_engagement_courses(course_id);
