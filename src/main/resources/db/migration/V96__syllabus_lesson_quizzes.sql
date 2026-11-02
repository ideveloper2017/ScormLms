-- O'quv dasturi darsining Test va Savol/Javob resurslari (Everest: dars -> resurslar). Kursga sinxronlashda
-- kurs testiga (course_quizzes) aylanadi va shu darsga bog'lanadi; baholash, urinishlar va proktoring test tizimida.
CREATE TABLE subject_syllabus_lesson_quizzes (
    id BIGSERIAL PRIMARY KEY,
    topic_id BIGINT NOT NULL REFERENCES subject_syllabus_topics(id) ON DELETE CASCADE,
    kind VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    instructions TEXT,
    duration_minutes INTEGER NOT NULL,
    allowed_attempts INTEGER NOT NULL,
    passing_percentage INTEGER NOT NULL,
    questions_json TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 1,
    version INTEGER NOT NULL DEFAULT 1,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_syllabus_lesson_quiz_kind CHECK (kind IN ('TEST', 'QUESTION')),
    CONSTRAINT ck_syllabus_lesson_quiz_attempts CHECK (allowed_attempts BETWEEN 1 AND 20),
    CONSTRAINT ck_syllabus_lesson_quiz_passing CHECK (passing_percentage BETWEEN 0 AND 100)
);
CREATE INDEX idx_syllabus_lesson_quiz_topic ON subject_syllabus_lesson_quizzes(topic_id, position);

-- Kurs testi qaysi darsda va qaysi dastur resursidan (dastur resursi o'chsa ham bog'lanish ma'lumoti qoladi)
ALTER TABLE course_quizzes
    ADD COLUMN module_id BIGINT REFERENCES course_modules(id) ON DELETE SET NULL,
    ADD COLUMN syllabus_quiz_id BIGINT,
    ADD COLUMN syllabus_quiz_version INTEGER;
CREATE INDEX idx_course_quiz_syllabus ON course_quizzes(course_id, syllabus_quiz_id) WHERE syllabus_quiz_id IS NOT NULL;
