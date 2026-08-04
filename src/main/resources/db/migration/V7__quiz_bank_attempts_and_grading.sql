CREATE TABLE IF NOT EXISTS quiz_questions (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    text TEXT NOT NULL,
    type VARCHAR(30) NOT NULL,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    points INTEGER NOT NULL DEFAULT 1,
    options_json TEXT,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_quiz_question_type CHECK (type IN ('SINGLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER')),
    CONSTRAINT ck_quiz_question_difficulty CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    CONSTRAINT ck_quiz_question_points CHECK (points BETWEEN 1 AND 1000)
);
CREATE INDEX IF NOT EXISTS idx_quiz_question_course ON quiz_questions(course_id, difficulty);

CREATE TABLE IF NOT EXISTS course_quizzes (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    title VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL DEFAULT '',
    opens_at TIMESTAMP WITH TIME ZONE NOT NULL,
    closes_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    allowed_attempts INTEGER NOT NULL DEFAULT 1,
    passing_percentage INTEGER NOT NULL DEFAULT 60,
    shuffle_questions BOOLEAN NOT NULL DEFAULT TRUE,
    show_result BOOLEAN NOT NULL DEFAULT TRUE,
    proctoring BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_course_quiz_window CHECK (opens_at < closes_at),
    CONSTRAINT ck_course_quiz_duration CHECK (duration_minutes BETWEEN 1 AND 1440),
    CONSTRAINT ck_course_quiz_attempts CHECK (allowed_attempts BETWEEN 1 AND 20),
    CONSTRAINT ck_course_quiz_passing CHECK (passing_percentage BETWEEN 0 AND 100),
    CONSTRAINT ck_course_quiz_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED'))
);
CREATE INDEX IF NOT EXISTS idx_course_quiz_course_window ON course_quizzes(course_id, opens_at, closes_at);

CREATE TABLE IF NOT EXISTS course_quiz_questions (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES course_quizzes(id),
    question_id BIGINT NOT NULL REFERENCES quiz_questions(id),
    position INTEGER NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_course_quiz_question UNIQUE (quiz_id, question_id),
    CONSTRAINT ck_course_quiz_question_position CHECK (position > 0)
);
CREATE INDEX IF NOT EXISTS idx_course_quiz_question_order ON course_quiz_questions(quiz_id, position);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES course_quizzes(id),
    enrollment_id BIGINT NOT NULL REFERENCES course_enrollments(id),
    attempt_number INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    question_order TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    total_points INTEGER NOT NULL DEFAULT 0,
    percentage DOUBLE PRECISION NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_quiz_attempt_number UNIQUE (quiz_id, enrollment_id, attempt_number),
    CONSTRAINT ck_quiz_attempt_number CHECK (attempt_number > 0),
    CONSTRAINT ck_quiz_attempt_status CHECK (status IN ('IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT')),
    CONSTRAINT ck_quiz_attempt_scores CHECK (score >= 0 AND total_points >= 0 AND percentage BETWEEN 0 AND 100),
    CONSTRAINT ck_quiz_attempt_duration CHECK (duration_seconds >= 0)
);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_quiz ON quiz_attempts(quiz_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_enrollment ON quiz_attempts(enrollment_id, status);

CREATE TABLE IF NOT EXISTS quiz_answers (
    id BIGSERIAL PRIMARY KEY,
    attempt_id BIGINT NOT NULL REFERENCES quiz_attempts(id),
    question_id BIGINT NOT NULL REFERENCES quiz_questions(id),
    answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    awarded_points INTEGER NOT NULL DEFAULT 0,
    answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_quiz_answer UNIQUE (attempt_id, question_id),
    CONSTRAINT ck_quiz_answer_points CHECK (awarded_points >= 0)
);
CREATE INDEX IF NOT EXISTS idx_quiz_answer_attempt ON quiz_answers(attempt_id);
