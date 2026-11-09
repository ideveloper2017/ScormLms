-- Baholash shkalasi "B+", "C+", "D+" harflarini beradi (GradeCalculation.letterGrade), lekin cheklov faqat
-- bitta harfga (A-F) ruxsat berardi: 65-69, 75-79 va 85-89 ball olgan talabaning yakuniy nazorat bahosini
-- saqlab bo'lmasdi (ck_exam_result_grade buzilishi). Ustun allaqachon VARCHAR(2).
ALTER TABLE exam_results DROP CONSTRAINT IF EXISTS ck_exam_result_grade;
ALTER TABLE exam_results ADD CONSTRAINT ck_exam_result_grade CHECK (grade IS NULL OR grade ~ '^[A-F][+-]?$');
