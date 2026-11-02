-- O'quv dasturi darsining kontenti (Everest "Dasturlar" -> modul -> dars -> resurslar): material fan bankida saqlanadi
-- va dars bilan bog'lanadi. Dars dasturdan o'chirilsa material fan bankida qoladi.
ALTER TABLE subject_materials
    ADD COLUMN syllabus_topic_id BIGINT REFERENCES subject_syllabus_topics(id) ON DELETE SET NULL,
    ADD COLUMN topic_position INTEGER;

CREATE INDEX idx_subject_material_topic ON subject_materials(syllabus_topic_id, topic_position) WHERE syllabus_topic_id IS NOT NULL;

-- Kursdagi nusxa: dastur bilan sinxronlashda yangilanadi va olib tashlanadi; o'qituvchi qo'shgan materialga tegilmaydi
ALTER TABLE course_contents ADD COLUMN from_syllabus BOOLEAN NOT NULL DEFAULT FALSE;
