-- GradeCalculation.letterGrade B+, C+, D+ qaytaradi va grade ustuni VARCHAR(2), lekin
-- V8 dagi constraint faqat bitta harfga ruxsat berardi: 65-69, 75-79, 85-89 ball olgan
-- natijani saqlash "violates check constraint ck_exam_result_grade" bilan yiqilardi.
ALTER TABLE exam_results DROP CONSTRAINT IF EXISTS ck_exam_result_grade;
ALTER TABLE exam_results ADD CONSTRAINT ck_exam_result_grade
    CHECK (grade IS NULL OR grade ~ '^[A-F]\+?$');
