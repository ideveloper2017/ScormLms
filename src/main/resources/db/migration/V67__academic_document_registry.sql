CREATE TABLE final_exam_call_letters (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id),
    document_number VARCHAR(80) NOT NULL,
    semester INTEGER NOT NULL,
    order_number VARCHAR(120) NOT NULL,
    order_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    generated_at TIMESTAMP WITH TIME ZONE,
    issued_by BIGINT REFERENCES users(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_call_letter_semester CHECK (semester BETWEEN 1 AND 20),
    CONSTRAINT ck_call_letter_dates CHECK (end_date >= start_date),
    CONSTRAINT ck_call_letter_status CHECK (status IN ('DRAFT', 'GENERATED', 'CONFIRMED'))
);
CREATE UNIQUE INDEX uq_call_letters_live_number ON final_exam_call_letters(LOWER(document_number)) WHERE deleted = FALSE;
CREATE INDEX idx_call_letters_student_state ON final_exam_call_letters(student_id, status, deleted);

CREATE TABLE student_transcripts (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id),
    document_number VARCHAR(80) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester INTEGER NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE,
    issued_by BIGINT REFERENCES users(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_transcript_semester CHECK (semester BETWEEN 1 AND 20)
);
CREATE UNIQUE INDEX uq_transcripts_live_number ON student_transcripts(LOWER(document_number)) WHERE deleted = FALSE;
CREATE INDEX idx_transcripts_student_year ON student_transcripts(student_id, academic_year, semester, deleted);
