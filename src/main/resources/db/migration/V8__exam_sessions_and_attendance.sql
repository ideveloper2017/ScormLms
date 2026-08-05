-- EDU-08: Semester final exam sessions with in-person attendance recording
-- Clause 21 of Decision 559
-- Stores exam session details (location, time, examiner) and attendance records with confirmation

CREATE TABLE IF NOT EXISTS exam_sessions (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    semester_id BIGINT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    exam_date DATE NOT NULL,
    exam_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    max_capacity INTEGER,
    examiner_id BIGINT NOT NULL REFERENCES users(id),
    secondary_examiner_id BIGINT REFERENCES users(id),
    exam_type VARCHAR(30) NOT NULL DEFAULT 'WRITTEN',
    duration_minutes INTEGER NOT NULL DEFAULT 120,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMP WITH TIME ZONE,
    held_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_exam_session_type CHECK (exam_type IN ('WRITTEN', 'ORAL', 'PRACTICAL', 'HYBRID')),
    CONSTRAINT ck_exam_session_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED')),
    CONSTRAINT ck_exam_session_duration CHECK (duration_minutes BETWEEN 1 AND 480),
    CONSTRAINT ck_exam_session_capacity CHECK (max_capacity IS NULL OR max_capacity > 0)
);
CREATE INDEX IF NOT EXISTS idx_exam_session_course ON exam_sessions(course_id, exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_session_examiner ON exam_sessions(examiner_id, exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_session_status ON exam_sessions(status, exam_date);

-- Attendance records for exam sessions with student confirmations
CREATE TABLE IF NOT EXISTS exam_attendance (
    id BIGSERIAL PRIMARY KEY,
    exam_session_id BIGINT NOT NULL REFERENCES exam_sessions(id),
    enrollment_id BIGINT NOT NULL REFERENCES course_enrollments(id),
    attendance_status VARCHAR(20) NOT NULL DEFAULT 'EXPECTED',
    arrival_time TIMESTAMP WITH TIME ZONE,
    departure_time TIMESTAMP WITH TIME ZONE,
    special_conditions VARCHAR(255),
    proctor_notes TEXT,
    attendance_verified_by BIGINT REFERENCES users(id),
    verification_time TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_exam_attendance_unique UNIQUE (exam_session_id, enrollment_id),
    CONSTRAINT ck_exam_attendance_status CHECK (attendance_status IN ('EXPECTED', 'PRESENT', 'LATE', 'ABSENT', 'EXCUSE', 'EXCUSED')),
    CONSTRAINT ck_exam_attendance_times CHECK (
        arrival_time IS NULL OR departure_time IS NULL OR arrival_time <= departure_time
    )
);
CREATE INDEX IF NOT EXISTS idx_exam_attendance_session ON exam_attendance(exam_session_id, attendance_status);
CREATE INDEX IF NOT EXISTS idx_exam_attendance_enrollment ON exam_attendance(enrollment_id, attendance_status);
CREATE INDEX IF NOT EXISTS idx_exam_attendance_verified ON exam_attendance(attendance_verified_by, verification_time);

-- Exam results and grades
CREATE TABLE IF NOT EXISTS exam_results (
    id BIGSERIAL PRIMARY KEY,
    exam_session_id BIGINT NOT NULL REFERENCES exam_sessions(id),
    enrollment_id BIGINT NOT NULL REFERENCES course_enrollments(id),
    score DECIMAL(5, 2) NOT NULL DEFAULT 0,
    total_score DECIMAL(5, 2) NOT NULL DEFAULT 100,
    percentage DOUBLE PRECISION NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    grade VARCHAR(2),
    graded_by BIGINT NOT NULL REFERENCES users(id),
    grading_date TIMESTAMP WITH TIME ZONE NOT NULL,
    comments TEXT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_exam_result_unique UNIQUE (exam_session_id, enrollment_id),
    CONSTRAINT ck_exam_result_scores CHECK (score >= 0 AND total_score > 0 AND percentage BETWEEN 0 AND 100),
    CONSTRAINT ck_exam_result_grade CHECK (grade IS NULL OR grade ~ '^[A-F]$')
);
CREATE INDEX IF NOT EXISTS idx_exam_result_session ON exam_results(exam_session_id, graded_by);
CREATE INDEX IF NOT EXISTS idx_exam_result_enrollment ON exam_results(enrollment_id, passed);

-- Appeal records for exam results
CREATE TABLE IF NOT EXISTS exam_appeals (
    id BIGSERIAL PRIMARY KEY,
    exam_result_id BIGINT NOT NULL REFERENCES exam_results(id),
    student_id BIGINT NOT NULL REFERENCES users(id),
    appeal_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    review_date TIMESTAMP WITH TIME ZONE,
    reviewed_by BIGINT REFERENCES users(id),
    decision TEXT,
    new_score DECIMAL(5, 2),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_exam_appeal_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PARTIAL')),
    CONSTRAINT ck_exam_appeal_score CHECK (new_score IS NULL OR new_score >= 0)
);
CREATE INDEX IF NOT EXISTS idx_exam_appeal_result ON exam_appeals(exam_result_id, status);
CREATE INDEX IF NOT EXISTS idx_exam_appeal_student ON exam_appeals(student_id, status);
CREATE INDEX IF NOT EXISTS idx_exam_appeal_date ON exam_appeals(appeal_date, status);

-- Audit trail for exam sessions (compliance)
CREATE TABLE IF NOT EXISTS exam_audit_log (
    id BIGSERIAL PRIMARY KEY,
    exam_session_id BIGINT NOT NULL REFERENCES exam_sessions(id),
    action VARCHAR(50) NOT NULL,
    actor_id BIGINT NOT NULL REFERENCES users(id),
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    action_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_exam_audit_session ON exam_audit_log(exam_session_id, action_time);
CREATE INDEX IF NOT EXISTS idx_exam_audit_actor ON exam_audit_log(actor_id, action_time);