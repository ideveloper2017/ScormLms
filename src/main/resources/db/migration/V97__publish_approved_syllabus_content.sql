-- Tasdiqlangan o'quv dasturi kontenti dastur bilan birga ekspertizadan o'tgan: kursdagi qoralama nusxalari va
-- dastur darslari talabaga ochiladi (endi sinxronlashda shunday qilinadi; bu — avval qoralama qolganlari uchun).
UPDATE course_modules m
SET status = 'PUBLISHED', published_at = COALESCE(m.published_at, NOW())
FROM courses c
JOIN subject_syllabi s ON s.id = c.syllabus_id AND s.status = 'APPROVED'
WHERE m.course_id = c.id
  AND m.deleted = FALSE AND m.status = 'DRAFT'
  AND m.syllabus_topic_id IN (SELECT t.id FROM subject_syllabus_topics t WHERE t.syllabus_id = s.id AND t.deleted = FALSE);

UPDATE course_contents cc
SET status = 'PUBLISHED',
    review_status = 'APPROVED',
    approved_revision_number = (
        SELECT MAX(r.revision_number) FROM course_content_revisions r WHERE r.content_id = cc.id AND r.deleted = FALSE
    ),
    published_at = NOW()
FROM course_modules m
JOIN courses c ON c.id = m.course_id
JOIN subject_syllabi s ON s.id = c.syllabus_id AND s.status = 'APPROVED'
WHERE cc.module_id = m.id
  AND cc.from_syllabus = TRUE AND cc.deleted = FALSE AND cc.status = 'DRAFT';
