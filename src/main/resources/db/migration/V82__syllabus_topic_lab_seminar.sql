-- Fan dasturi mavzulariga laboratoriya va seminar mashg'ulot turlari qo'shiladi
ALTER TABLE subject_syllabus_topics DROP CONSTRAINT ck_syllabus_topic_type;
ALTER TABLE subject_syllabus_topics ADD CONSTRAINT ck_syllabus_topic_type
    CHECK (topic_type IN ('THEORETICAL', 'PRACTICAL', 'LABORATORY', 'SEMINAR'));

ALTER TABLE course_modules DROP CONSTRAINT ck_course_module_topic_type;
ALTER TABLE course_modules ADD CONSTRAINT ck_course_module_topic_type
    CHECK (topic_type IS NULL OR topic_type IN ('THEORETICAL', 'PRACTICAL', 'LABORATORY', 'SEMINAR'));
