-- Ishchi o'quv rejadagi "Kurs ishi (loyihasi)" ustuni: KI — kurs ishi, KL — kurs loyihasi
ALTER TABLE program_curriculum_subjects ADD COLUMN course_work_type VARCHAR(20);
ALTER TABLE program_curriculum_subjects ADD CONSTRAINT ck_curriculum_subject_course_work_type
    CHECK (course_work_type IS NULL OR course_work_type IN ('COURSE_WORK', 'COURSE_PROJECT'));
