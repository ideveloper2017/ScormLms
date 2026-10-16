-- Additive-only: test yaxlitligi (1-bosqich).
--
-- 1) Savol bankidan har talabaga tasodifiy to'plam: null — testga biriktirilgan barcha savollar
--    (avvalgi xatti-harakat), N — har urinish uchun N ta savol qiyinlik bo'yicha mutanosib tanlanadi.
ALTER TABLE course_quizzes
    ADD COLUMN questions_per_attempt INTEGER;
ALTER TABLE course_quizzes
    ADD CONSTRAINT ck_course_quiz_questions_per_attempt CHECK (questions_per_attempt IS NULL OR questions_per_attempt >= 1);

-- 2) O'qituvchi javobni qo'lda baholashi (qisqa javob va h.k.). Qo'lda qo'yilgan ball kalit tuzatilib
--    qayta baholanganda ham saqlanadi.
ALTER TABLE quiz_answers
    ADD COLUMN manually_graded BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN grader_comment TEXT,
    ADD COLUMN graded_by_id BIGINT REFERENCES users(id),
    ADD COLUMN graded_at TIMESTAMP WITH TIME ZONE;
