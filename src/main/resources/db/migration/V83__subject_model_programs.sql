-- O'quv dasturi (namunaviy, fan bo'yicha umumiy) va undan yaratiladigan fan dasturi (ishchi dastur:
-- o'quv yili va semestr uchun mavzular, soatlar, kurs). subject_syllabi endi fan dasturi (ishchi dastur).
CREATE TABLE subject_model_programs (
    id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT NOT NULL REFERENCES subjects(id),
    language VARCHAR(20) NOT NULL,
    name VARCHAR(500) NOT NULL,
    short_description VARCHAR(2000) NOT NULL,
    requirements TEXT,
    full_description TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);
CREATE UNIQUE INDEX uq_model_program_subject_language ON subject_model_programs(subject_id, language) WHERE deleted = FALSE;

ALTER TABLE subject_syllabi ADD COLUMN model_program_id BIGINT REFERENCES subject_model_programs(id);
ALTER TABLE subject_syllabi ADD COLUMN academic_year VARCHAR(20);
ALTER TABLE subject_syllabi ADD COLUMN semester INTEGER;
ALTER TABLE subject_syllabi ADD CONSTRAINT ck_syllabus_semester CHECK (semester IS NULL OR semester BETWEEN 1 AND 12);
CREATE INDEX idx_subject_syllabi_model_program ON subject_syllabi(model_program_id);

-- Mavjud fan dasturlari uchun fan va til bo'yicha o'quv dasturi yaratiladi (eng birinchi dastur ma'lumotlari bilan)
INSERT INTO subject_model_programs (subject_id, language, name, short_description, requirements, full_description, active, created_at, updated_at)
SELECT DISTINCT ON (s.subject_id, s.language)
       s.subject_id, s.language, s.name, s.short_description, s.requirements, s.full_description, TRUE, NOW(), NOW()
FROM subject_syllabi s
WHERE s.deleted = FALSE
ORDER BY s.subject_id, s.language, s.id;

UPDATE subject_syllabi s
SET model_program_id = m.id
FROM subject_model_programs m
WHERE m.subject_id = s.subject_id AND m.language = s.language AND m.deleted = FALSE AND s.deleted = FALSE;
