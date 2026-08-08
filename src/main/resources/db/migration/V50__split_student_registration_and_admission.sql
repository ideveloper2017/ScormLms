-- Talabaning shaxsiy kartochkasi akademik qabuldan oldin REGISTERED holatda saqlanadi.
ALTER TABLE student_lifecycle_events DROP CONSTRAINT IF EXISTS ck_student_lifecycle_from_status;
ALTER TABLE student_lifecycle_events ADD CONSTRAINT ck_student_lifecycle_from_status CHECK (
    from_status IS NULL OR from_status IN ('REGISTERED', 'ACTIVE', 'SUSPENDED', 'EXPELLED', 'GRADUATED')
);

ALTER TABLE student_lifecycle_events DROP CONSTRAINT IF EXISTS ck_student_lifecycle_to_status;
ALTER TABLE student_lifecycle_events ADD CONSTRAINT ck_student_lifecycle_to_status CHECK (
    to_status IN ('REGISTERED', 'ACTIVE', 'SUSPENDED', 'EXPELLED', 'GRADUATED')
);
