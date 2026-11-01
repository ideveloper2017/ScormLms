-- Nazorat turi: MIDTERM — oraliq nazorat (ON), FINAL — yakuniy nazorat (YN).
-- Shu paytgacha sessiyalar "Yakuniy nazorat" sahifasida yaratilgan, shuning uchun mavjudlari — FINAL.
ALTER TABLE exam_sessions ADD COLUMN control_type VARCHAR(20) NOT NULL DEFAULT 'FINAL';
ALTER TABLE exam_sessions ADD CONSTRAINT ck_exam_session_control_type
    CHECK (control_type IN ('MIDTERM', 'FINAL'));
