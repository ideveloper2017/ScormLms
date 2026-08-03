-- SCORM LMS PostgreSQL baseline.
-- Existing Hibernate-managed databases are baselined at version 0; therefore
-- all statements must remain safe when tables or indexes already exist.

CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS faculties (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(255) UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);

CREATE TABLE IF NOT EXISTS departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    faculty_id BIGINT REFERENCES faculties(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);

CREATE TABLE IF NOT EXISTS programs (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(255),
    degree_level VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    distance_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    information_technology_program BOOLEAN NOT NULL DEFAULT FALSE,
    education_language VARCHAR(10) NOT NULL DEFAULT 'uz',
    distance_admission_limit INTEGER,
    license_reference VARCHAR(200),
    department_id BIGINT REFERENCES departments(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);

-- Adds 559-specific columns to databases previously created by Hibernate.
ALTER TABLE programs ADD COLUMN IF NOT EXISTS distance_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS information_technology_program BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS education_language VARCHAR(10) NOT NULL DEFAULT 'uz';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS distance_admission_limit INTEGER;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS license_reference VARCHAR(200);

CREATE TABLE IF NOT EXISTS study_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    education_year VARCHAR(255),
    language VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    program_id BIGINT REFERENCES programs(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);

CREATE TABLE IF NOT EXISTS subjects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(255) UNIQUE,
    credits INTEGER,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    program_id BIGINT REFERENCES programs(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(255),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    jshshir VARCHAR(255) UNIQUE,
    faculty VARCHAR(255),
    direction VARCHAR(255),
    group_name VARCHAR(255),
    role_id BIGINT REFERENCES roles(id),
    status VARCHAR(20) NOT NULL,
    face_photo_url VARCHAR(500),
    face_descriptor TEXT,
    face_uploaded_at TIMESTAMP WITHOUT TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    one_id_subject VARCHAR(200),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);

CREATE TABLE IF NOT EXISTS courses (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    slug VARCHAR(255),
    short_description TEXT,
    user_id BIGINT,
    category_id BIGINT,
    course_type VARCHAR(255),
    status VARCHAR(255),
    level VARCHAR(255),
    language VARCHAR(255),
    is_paid INTEGER,
    price DOUBLE PRECISION,
    discount_flag INTEGER,
    discounted_price DOUBLE PRECISION,
    meta_keywords TEXT,
    meta_description TEXT,
    thumbnail VARCHAR(255),
    banner VARCHAR(255),
    preview VARCHAR(255),
    description TEXT,
    requirements TEXT,
    outcomes TEXT,
    faqs TEXT,
    instructor_ids TEXT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);
CREATE INDEX IF NOT EXISTS idx_course_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_course_category_id ON courses(category_id);

CREATE TABLE IF NOT EXISTS teachers (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    email VARCHAR(255),
    academic_degree VARCHAR(255),
    academic_rank VARCHAR(255),
    position VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    department_id BIGINT REFERENCES departments(id),
    user_id BIGINT REFERENCES users(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);

CREATE TABLE IF NOT EXISTS teacher_subjects (
    teacher_id BIGINT NOT NULL REFERENCES teachers(id),
    subject_id BIGINT NOT NULL REFERENCES subjects(id),
    PRIMARY KEY (teacher_id, subject_id)
);

CREATE TABLE IF NOT EXISTS students (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id),
    pinfl VARCHAR(14) NOT NULL UNIQUE,
    last_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    birth_date DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    citizenship VARCHAR(20) NOT NULL,
    passport_type VARCHAR(25),
    passport_series VARCHAR(10),
    passport_number VARCHAR(20),
    passport_issued_date DATE,
    passport_expiry_date DATE,
    passport_issued_by VARCHAR(300),
    photo_url VARCHAR(500),
    phone_number VARCHAR(20),
    student_email VARCHAR(150),
    permanent_region VARCHAR(100),
    permanent_district VARCHAR(100),
    permanent_address VARCHAR(500),
    current_region VARCHAR(100),
    current_district VARCHAR(100),
    current_address VARCHAR(500),
    student_number VARCHAR(50) NOT NULL UNIQUE,
    university_id BIGINT,
    faculty_id BIGINT,
    department_id BIGINT,
    program_id BIGINT,
    degree_level VARCHAR(15) NOT NULL,
    education_form VARCHAR(15) NOT NULL,
    education_language VARCHAR(10),
    course_number INTEGER,
    group_id BIGINT,
    academic_year VARCHAR(20),
    admission_date DATE,
    admission_order_number VARCHAR(100),
    student_status VARCHAR(20) NOT NULL,
    payment_type VARCHAR(15),
    contract_number VARCHAR(100),
    contract_amount NUMERIC(14,2),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_pinfl ON students(pinfl);
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_number ON students(student_number);
CREATE INDEX IF NOT EXISTS idx_student_passport ON students(passport_series, passport_number);
CREATE INDEX IF NOT EXISTS idx_student_faculty ON students(faculty_id);
CREATE INDEX IF NOT EXISTS idx_student_department ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_student_group ON students(group_id);
CREATE INDEX IF NOT EXISTS idx_student_status ON students(student_status);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(200) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    replaced_by_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    ip VARCHAR(255),
    failed_count INTEGER NOT NULL DEFAULT 0,
    first_failed_at TIMESTAMP WITH TIME ZONE,
    last_failed_at TIMESTAMP WITH TIME ZONE,
    locked_until TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    username VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    details VARCHAR(2048),
    method VARCHAR(255),
    path VARCHAR(255),
    status INTEGER,
    ip VARCHAR(255),
    user_agent VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    priority VARCHAR(10) NOT NULL,
    related_id VARCHAR(255),
    action_url VARCHAR(500),
    user_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_notif_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_is_read ON notifications(user_id, is_read);

CREATE TABLE IF NOT EXISTS live_classes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    course_id BIGINT,
    class_topic VARCHAR(255),
    provider VARCHAR(255),
    class_date_and_time TIMESTAMP WITHOUT TIME ZONE,
    additional_info TEXT,
    note TEXT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);

CREATE TABLE IF NOT EXISTS scorm_packages (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    title VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL,
    manifest_identifier VARCHAR(300),
    entry_point VARCHAR(1000) NOT NULL,
    storage_key VARCHAR(64) NOT NULL UNIQUE,
    sha256 VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL,
    imported_by VARCHAR(150) NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);
CREATE INDEX IF NOT EXISTS idx_scorm_package_course ON scorm_packages(course_id);

CREATE TABLE IF NOT EXISTS scorm_attempts (
    id BIGSERIAL PRIMARY KEY,
    package_id BIGINT NOT NULL REFERENCES scorm_packages(id),
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    score_raw DOUBLE PRECISION,
    progress_measure DOUBLE PRECISION,
    total_time_seconds BIGINT NOT NULL DEFAULT 0,
    runtime_data TEXT NOT NULL DEFAULT '{}',
    launch_token_hash VARCHAR(64) UNIQUE,
    launch_expires_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_scorm_attempt_package_user UNIQUE (package_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_scorm_attempt_user ON scorm_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_scorm_attempt_package ON scorm_attempts(package_id);
CREATE INDEX IF NOT EXISTS idx_scorm_launch_token ON scorm_attempts(launch_token_hash);

