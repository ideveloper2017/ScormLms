-- Soat fan bo'yicha o'quv rejada belgilanadi; dastur mavzusida soat kiritilmaydi (eski qiymatlar saqlanadi)
ALTER TABLE subject_syllabus_topics ALTER COLUMN hours DROP NOT NULL;
ALTER TABLE subject_syllabus_topics DROP CONSTRAINT ck_syllabus_topic_hours;
ALTER TABLE subject_syllabus_topics ADD CONSTRAINT ck_syllabus_topic_hours CHECK (hours IS NULL OR hours > 0);
