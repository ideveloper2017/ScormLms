-- O'quv rejaning kuzgi (toq semestrlar) va bahorgi (juft semestrlar) semestr sanalari.
-- Reja tasdiqlanganda har bir semestr muddati shulardan avtomatik yaratiladi.
ALTER TABLE program_curriculum_versions
    ADD COLUMN autumn_starts_on DATE,
    ADD COLUMN autumn_ends_on DATE,
    ADD COLUMN spring_starts_on DATE,
    ADD COLUMN spring_ends_on DATE;
ALTER TABLE program_curriculum_versions ADD CONSTRAINT ck_curriculum_autumn_dates
    CHECK (autumn_starts_on IS NULL OR autumn_ends_on IS NULL OR autumn_ends_on > autumn_starts_on);
ALTER TABLE program_curriculum_versions ADD CONSTRAINT ck_curriculum_spring_dates
    CHECK (spring_starts_on IS NULL OR spring_ends_on IS NULL OR spring_ends_on > spring_starts_on);
