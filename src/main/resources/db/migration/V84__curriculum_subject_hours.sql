-- Ishchi o'quv reja fani: T/r raqami va soatlar mashg'ulot turlari bo'yicha (reja fan darajasida belgilaydi).
-- Bir fan bir necha semestrga cho'zilishi mumkin ("Dasturlash 1,2") — har semestr alohida qator.
ALTER TABLE program_curriculum_subjects ADD COLUMN plan_row_number VARCHAR(20);
ALTER TABLE program_curriculum_subjects ADD COLUMN lecture_hours INTEGER NOT NULL DEFAULT 0;
ALTER TABLE program_curriculum_subjects ADD COLUMN practical_hours INTEGER NOT NULL DEFAULT 0;
ALTER TABLE program_curriculum_subjects ADD COLUMN laboratory_hours INTEGER NOT NULL DEFAULT 0;
ALTER TABLE program_curriculum_subjects ADD COLUMN seminar_hours INTEGER NOT NULL DEFAULT 0;
ALTER TABLE program_curriculum_subjects ADD COLUMN course_work_hours INTEGER NOT NULL DEFAULT 0;
-- Auditoriya jami: turlar yig'indisi yoki (masofaviy shaklda) turlarga bo'linmagan umumiy soat
ALTER TABLE program_curriculum_subjects ADD COLUMN auditory_hours INTEGER NOT NULL DEFAULT 0;
ALTER TABLE program_curriculum_subjects ADD COLUMN self_study_hours INTEGER NOT NULL DEFAULT 0;
ALTER TABLE program_curriculum_subjects ADD CONSTRAINT ck_curriculum_subject_hours CHECK (
    lecture_hours >= 0 AND practical_hours >= 0 AND laboratory_hours >= 0 AND seminar_hours >= 0
    AND course_work_hours >= 0 AND auditory_hours >= 0 AND self_study_hours >= 0
);

-- Bir fan reja ichida har semestrda bir marta (o'chirilgan qatorlar hisobga olinmaydi)
ALTER TABLE program_curriculum_subjects DROP CONSTRAINT uq_curriculum_subject;
CREATE UNIQUE INDEX uq_curriculum_subject_semester
    ON program_curriculum_subjects(curriculum_version_id, subject_id, semester) WHERE deleted = FALSE;
