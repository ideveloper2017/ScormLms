CREATE TABLE IF NOT EXISTS course_quiz_proctors (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES course_quizzes(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_course_quiz_proctor UNIQUE (quiz_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_course_quiz_proctor_user ON course_quiz_proctors(user_id, quiz_id);
