-- O'quv rejadagi fanga o'quv dasturi biriktiriladi (bitta dastur bir necha rejaga biriktirilishi mumkin;
-- ko'p semestrli fanning barcha semestr qatorlari bitta dasturga bog'lanadi)
ALTER TABLE program_curriculum_subjects ADD COLUMN syllabus_id BIGINT REFERENCES subject_syllabi(id);
CREATE INDEX idx_curriculum_subjects_syllabus ON program_curriculum_subjects(syllabus_id);

-- Ko'p semestrli fan dasturida mavzu qaysi qismga (1-qism -> birinchi semestr, 2-qism -> ikkinchi) tegishli
ALTER TABLE subject_syllabus_topics ADD COLUMN part INTEGER;
ALTER TABLE subject_syllabus_topics ADD CONSTRAINT ck_syllabus_topic_part CHECK (part IS NULL OR part BETWEEN 1 AND 12);
