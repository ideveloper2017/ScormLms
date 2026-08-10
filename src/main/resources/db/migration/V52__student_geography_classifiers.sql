-- V63 / UX-STU-05: boshqariladigan fuqarolik va hudud klassifikatorlari.
-- Kodlar integratsiya uchun ichki barqaror kodlar; SOATO sifatida talqin qilinmaydi.
CREATE TABLE country_classifiers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(2) NOT NULL,
    name_uz VARCHAR(150) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_country_classifier_code UNIQUE (code),
    CONSTRAINT ck_country_classifier_code CHECK (code ~ '^[A-Z]{2}$'),
    CONSTRAINT ck_country_classifier_sort CHECK (sort_order BETWEEN 0 AND 10000)
);

CREATE TABLE region_classifiers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name_uz VARCHAR(150) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_region_classifier_code UNIQUE (code),
    CONSTRAINT ck_region_classifier_sort CHECK (sort_order BETWEEN 0 AND 10000)
);

CREATE TABLE district_classifiers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL,
    name_uz VARCHAR(150) NOT NULL,
    region_id BIGINT NOT NULL REFERENCES region_classifiers(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT uk_district_classifier_code UNIQUE (code),
    CONSTRAINT ck_district_classifier_sort CHECK (sort_order BETWEEN 0 AND 10000)
);
CREATE INDEX idx_district_classifier_region ON district_classifiers(region_id, active, deleted);

INSERT INTO country_classifiers(code, name_uz, sort_order) VALUES
 ('UZ', 'O''zbekiston', 1), ('KZ', 'Qozog''iston', 10), ('KG', 'Qirg''iziston', 20),
 ('TJ', 'Tojikiston', 30), ('TM', 'Turkmaniston', 40), ('AF', 'Afg''oniston', 50),
 ('RU', 'Rossiya', 60), ('AZ', 'Ozarbayjon', 70), ('TR', 'Turkiya', 80),
 ('CN', 'Xitoy', 90), ('KR', 'Koreya Respublikasi', 100), ('US', 'Amerika Qo''shma Shtatlari', 110),
 ('DE', 'Germaniya', 120), ('GB', 'Buyuk Britaniya', 130), ('IL', 'Isroil', 140);

INSERT INTO region_classifiers(code, name_uz, sort_order) VALUES
 ('UZ-QR', 'Qoraqalpog''iston Respublikasi', 1), ('UZ-AN', 'Andijon viloyati', 2),
 ('UZ-BU', 'Buxoro viloyati', 3), ('UZ-JI', 'Jizzax viloyati', 4),
 ('UZ-QA', 'Qashqadaryo viloyati', 5), ('UZ-NW', 'Navoiy viloyati', 6),
 ('UZ-NG', 'Namangan viloyati', 7), ('UZ-SA', 'Samarqand viloyati', 8),
 ('UZ-SU', 'Surxondaryo viloyati', 9), ('UZ-SI', 'Sirdaryo viloyati', 10),
 ('UZ-TO', 'Toshkent viloyati', 11), ('UZ-FA', 'Farg''ona viloyati', 12),
 ('UZ-XO', 'Xorazm viloyati', 13), ('UZ-TK', 'Toshkent shahri', 14);

-- NamDTU uchun birinchi ishchi to'plam; qolgan tumanlar admin CRUD orqali boshqariladi.
INSERT INTO district_classifiers(code, name_uz, region_id, sort_order)
SELECT seed.code, seed.name_uz, r.id, seed.sort_order
FROM region_classifiers r
JOIN (VALUES
 ('UZ-NG-NAM', 'Namangan shahri', 1), ('UZ-NG-MIN', 'Mingbuloq tumani', 2),
 ('UZ-NG-KOS', 'Kosonsoy tumani', 3), ('UZ-NG-NOR', 'Norin tumani', 4),
 ('UZ-NG-POP', 'Pop tumani', 5), ('UZ-NG-TOR', 'To''raqo''rg''on tumani', 6),
 ('UZ-NG-UYC', 'Uychi tumani', 7), ('UZ-NG-UCH', 'Uchqo''rg''on tumani', 8),
 ('UZ-NG-CHO', 'Chortoq tumani', 9), ('UZ-NG-CHU', 'Chust tumani', 10),
 ('UZ-NG-YAN', 'Yangiqo''rg''on tumani', 11), ('UZ-NG-DAV', 'Davlatobod tumani', 12),
 ('UZ-NG-YNG', 'Yangi Namangan tumani', 13)
) AS seed(code, name_uz, sort_order) ON TRUE
WHERE r.code = 'UZ-NG';

ALTER TABLE students ADD COLUMN citizenship_country_id BIGINT REFERENCES country_classifiers(id);
ALTER TABLE students ADD COLUMN permanent_region_id BIGINT REFERENCES region_classifiers(id);
ALTER TABLE students ADD COLUMN permanent_district_id BIGINT REFERENCES district_classifiers(id);
ALTER TABLE students ADD COLUMN current_region_id BIGINT REFERENCES region_classifiers(id);
ALTER TABLE students ADD COLUMN current_district_id BIGINT REFERENCES district_classifiers(id);

UPDATE students
SET citizenship_country_id = (SELECT id FROM country_classifiers WHERE code = 'UZ')
WHERE citizenship = 'UZBEKISTAN' AND citizenship_country_id IS NULL;

CREATE INDEX idx_student_citizenship_country ON students(citizenship_country_id);
CREATE INDEX idx_student_permanent_region ON students(permanent_region_id);
CREATE INDEX idx_student_current_region ON students(current_region_id);
