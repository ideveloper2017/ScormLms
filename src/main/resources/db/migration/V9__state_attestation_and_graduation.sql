-- EDU-09: Davlat Attestatsiyasi va Bitiruv Nazorat Jurnali
-- State Attestation and Graduation Exam Journal
-- Clause 21 of Decision 559
-- Stores state attestation sessions, student defenses, grades, and graduation certificates

CREATE TABLE IF NOT EXISTS state_attestation_sessions (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    semester_id BIGINT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    exam_date DATE NOT NULL,
    exam_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    commission_chair_id BIGINT NOT NULL REFERENCES users(id),
    defense_type VARCHAR(30) NOT NULL DEFAULT 'BACHELOR',
    min_commission_members INTEGER NOT NULL DEFAULT 3,
    min_pass_score INTEGER NOT NULL DEFAULT 60,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMP WITH TIME ZONE,
    held_at TIMESTAMP WITH TIME ZONE,
    result_published_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_attestation_session_type CHECK (defense_type IN ('BACHELOR', 'MASTER')),
    CONSTRAINT ck_attestation_session_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED')),
    CONSTRAINT ck_attestation_session_pass_score CHECK (min_pass_score BETWEEN 0 AND 100),
    CONSTRAINT ck_attestation_session_members CHECK (min_commission_members BETWEEN 1 AND 10)
);
CREATE INDEX IF NOT EXISTS idx_attestation_session_course ON state_attestation_sessions(course_id, exam_date);
CREATE INDEX IF NOT EXISTS idx_attestation_session_chair ON state_attestation_sessions(commission_chair_id, exam_date);
CREATE INDEX IF NOT EXISTS idx_attestation_session_status ON state_attestation_sessions(status, exam_date);

-- Commission members for attestation sessions
CREATE TABLE IF NOT EXISTS attestation_commission_members (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES state_attestation_sessions(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    appointed_by BIGINT NOT NULL REFERENCES users(id),
    appointed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_commission_member UNIQUE (session_id, user_id),
    CONSTRAINT ck_commission_role CHECK (role IN ('CHAIR', 'MEMBER', 'SECRETARY'))
);
CREATE INDEX IF NOT EXISTS idx_commission_member_session ON attestation_commission_members(session_id, role);
CREATE INDEX IF NOT EXISTS idx_commission_member_user ON attestation_commission_members(user_id);

-- Student defense records
CREATE TABLE IF NOT EXISTS student_defenses (
    id BIGSERIAL PRIMARY KEY,
    attestation_session_id BIGINT NOT NULL REFERENCES state_attestation_sessions(id),
    enrollment_id BIGINT NOT NULL REFERENCES course_enrollments(id),
    defense_status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    defense_date DATE,
    defense_time TIME,
    presentation_file_url VARCHAR(500),
    presentation_file_name VARCHAR(255),
    defense_notes TEXT,
    commission_decision VARCHAR(20),
    commission_score DECIMAL(5, 2) DEFAULT 0,
    total_graders INTEGER DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_student_defense UNIQUE (attestation_session_id, enrollment_id),
    CONSTRAINT ck_defense_status CHECK (defense_status IN ('SCHEDULED', 'DEFENDED', 'CANCELLED', 'RESCHEDULED')),
    CONSTRAINT ck_defense_decision CHECK (commission_decision IS NULL OR commission_decision IN ('PASS', 'FAIL', 'RETAKE')),
    CONSTRAINT ck_defense_score CHECK (commission_score >= 0 AND commission_score <= 100)
);
CREATE INDEX IF NOT EXISTS idx_student_defense_session ON student_defenses(attestation_session_id, defense_status);
CREATE INDEX IF NOT EXISTS idx_student_defense_enrollment ON student_defenses(enrollment_id);

-- Individual grades from each commission member
CREATE TABLE IF NOT EXISTS attestation_grades (
    id BIGSERIAL PRIMARY KEY,
    student_defense_id BIGINT NOT NULL REFERENCES student_defenses(id),
    graded_by BIGINT NOT NULL REFERENCES users(id),
    score DECIMAL(5, 2) NOT NULL DEFAULT 0,
    criteria_scores TEXT,
    comments TEXT,
    grading_date TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_attestation_grade UNIQUE (student_defense_id, graded_by),
    CONSTRAINT ck_attestation_grade_score CHECK (score >= 0 AND score <= 100)
);
CREATE INDEX IF NOT EXISTS idx_attestation_grade_defense ON attestation_grades(student_defense_id);
CREATE INDEX IF NOT EXISTS idx_attestation_grade_grader ON attestation_grades(graded_by);

-- Graduation certificates issued to passed students
CREATE TABLE IF NOT EXISTS graduation_certificates (
    id BIGSERIAL PRIMARY KEY,
    student_defense_id BIGINT NOT NULL UNIQUE REFERENCES student_defenses(id),
    certificate_number VARCHAR(50) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    issued_by BIGINT NOT NULL REFERENCES users(id),
    specialization VARCHAR(255),
    gpa_final DECIMAL(5, 2),
    certificate_file_url VARCHAR(500),
    certificate_file_name VARCHAR(255),
    qr_code_url VARCHAR(500),
    verification_token VARCHAR(100),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);
CREATE INDEX IF NOT EXISTS idx_graduation_certificate_number ON graduation_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_graduation_certificate_token ON graduation_certificates(verification_token);
CREATE INDEX IF NOT EXISTS idx_graduation_certificate_issued_by ON graduation_certificates(issued_by, issue_date);

-- Official attestation protocol/journal
CREATE TABLE IF NOT EXISTS attestation_protocols (
    id BIGSERIAL PRIMARY KEY,
    attestation_session_id BIGINT NOT NULL UNIQUE REFERENCES state_attestation_sessions(id),
    protocol_number VARCHAR(50) NOT NULL UNIQUE,
    protocol_date DATE NOT NULL,
    total_students INTEGER NOT NULL DEFAULT 0,
    passed_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    retake_count INTEGER NOT NULL DEFAULT 0,
    protocol_file_url VARCHAR(500),
    protocol_file_name VARCHAR(255),
    approver_id BIGINT REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);
CREATE INDEX IF NOT EXISTS idx_attestation_protocol_number ON attestation_protocols(protocol_number);
CREATE INDEX IF NOT EXISTS idx_attestation_protocol_date ON attestation_protocols(protocol_date);
CREATE INDEX IF NOT EXISTS idx_attestation_protocol_approver ON attestation_protocols(approver_id, approved_at);

-- Audit trail for state attestation (compliance)
CREATE TABLE IF NOT EXISTS attestation_audit_log (
    id BIGSERIAL PRIMARY KEY,
    attestation_session_id BIGINT NOT NULL REFERENCES state_attestation_sessions(id),
    action VARCHAR(50) NOT NULL,
    actor_id BIGINT NOT NULL REFERENCES users(id),
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    action_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_attestation_audit_session ON attestation_audit_log(attestation_session_id, action_time);
CREATE INDEX IF NOT EXISTS idx_attestation_audit_actor ON attestation_audit_log(actor_id, action_time);