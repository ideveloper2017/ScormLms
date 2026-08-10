-- UX-EDU-03A: backward-compatible academic year and semester catalogs.
-- Existing domain tables keep their historical string/integer snapshots.
CREATE TABLE academic_year_periods (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(9) NOT NULL,
    starts_on DATE NOT NULL,
    ends_on DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_academic_year_period_code UNIQUE (code),
    CONSTRAINT ck_academic_year_period_dates CHECK (ends_on > starts_on),
    CONSTRAINT ck_academic_year_period_current_active CHECK (is_current = FALSE OR active = TRUE)
);
CREATE INDEX idx_academic_year_period_state ON academic_year_periods(active, is_current, deleted);

CREATE TABLE academic_semester_definitions (
    id BIGSERIAL PRIMARY KEY,
    semester_number INTEGER NOT NULL,
    name_uz VARCHAR(100) NOT NULL,
    course_number INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_academic_semester_number UNIQUE (semester_number),
    CONSTRAINT ck_academic_semester_number CHECK (semester_number BETWEEN 1 AND 12),
    CONSTRAINT ck_academic_semester_course CHECK (course_number BETWEEN 1 AND 6)
);
CREATE INDEX idx_academic_semester_state ON academic_semester_definitions(active, semester_number, deleted);

INSERT INTO academic_year_periods(code, starts_on, ends_on, active, is_current) VALUES
 ('2023-2024', DATE '2023-09-01', DATE '2024-08-31', TRUE, FALSE),
 ('2024-2025', DATE '2024-09-01', DATE '2025-08-31', TRUE, FALSE),
 ('2025-2026', DATE '2025-09-01', DATE '2026-08-31', TRUE, FALSE),
 ('2026-2027', DATE '2026-09-01', DATE '2027-08-31', TRUE, TRUE),
 ('2027-2028', DATE '2027-09-01', DATE '2028-08-31', TRUE, FALSE),
 ('2028-2029', DATE '2028-09-01', DATE '2029-08-31', TRUE, FALSE);

INSERT INTO academic_semester_definitions(semester_number, name_uz, course_number, active) VALUES
 (1, '1-semestr', 1, TRUE), (2, '2-semestr', 1, TRUE),
 (3, '3-semestr', 2, TRUE), (4, '4-semestr', 2, TRUE),
 (5, '5-semestr', 3, TRUE), (6, '6-semestr', 3, TRUE),
 (7, '7-semestr', 4, TRUE), (8, '8-semestr', 4, TRUE),
 (9, '9-semestr', 5, TRUE), (10, '10-semestr', 5, TRUE),
 (11, '11-semestr', 6, TRUE), (12, '12-semestr', 6, TRUE);
