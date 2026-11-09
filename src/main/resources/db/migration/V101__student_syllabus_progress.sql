-- Talaba fanni kurssiz, o'quv dasturidan o'qiydi: dastur darsi materialini bajarganligi (foydalanuvchi qarori, 2026-11-04)
CREATE TABLE student_syllabus_progress (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students (id) ON DELETE CASCADE,
    material_id BIGINT NOT NULL REFERENCES subject_materials (id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_student_syllabus_progress UNIQUE (student_id, material_id)
);
CREATE INDEX idx_student_syllabus_progress_student ON student_syllabus_progress (student_id);
