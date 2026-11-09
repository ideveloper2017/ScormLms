-- O'quv rejadagi fan (semestr qatori) uchun mas'ul o'qituvchi
ALTER TABLE program_curriculum_subjects ADD COLUMN teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL;
CREATE INDEX idx_curriculum_subject_teacher ON program_curriculum_subjects(teacher_id);
