CREATE TABLE reference_labels (
    id BIGSERIAL PRIMARY KEY,
    label_key VARCHAR(180) NOT NULL,
    label VARCHAR(500) NOT NULL,
    module_name VARCHAR(120) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    text_uz_latin VARCHAR(1000) NOT NULL DEFAULT '',
    text_uz_cyrillic VARCHAR(1000) NOT NULL DEFAULT '',
    text_kaa VARCHAR(1000) NOT NULL DEFAULT '',
    text_ru VARCHAR(1000) NOT NULL DEFAULT '',
    text_en VARCHAR(1000) NOT NULL DEFAULT '',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);

CREATE UNIQUE INDEX uq_reference_labels_live_key_module
    ON reference_labels(LOWER(label_key), LOWER(module_name)) WHERE deleted = FALSE;
CREATE INDEX idx_reference_labels_state_module ON reference_labels(deleted, active, module_name, label_key);

CREATE TABLE nationalities (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(250) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    text_uz_latin VARCHAR(1000) NOT NULL DEFAULT '',
    text_uz_cyrillic VARCHAR(1000) NOT NULL DEFAULT '',
    text_kaa VARCHAR(1000) NOT NULL DEFAULT '',
    text_ru VARCHAR(1000) NOT NULL DEFAULT '',
    text_en VARCHAR(1000) NOT NULL DEFAULT '',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);

CREATE UNIQUE INDEX uq_nationalities_live_name ON nationalities(LOWER(name)) WHERE deleted = FALSE;
CREATE INDEX idx_nationalities_state_name ON nationalities(deleted, active, name);

CREATE TABLE system_languages (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(120) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);

CREATE UNIQUE INDEX uq_system_languages_live_code ON system_languages(LOWER(code)) WHERE deleted = FALSE;

CREATE TABLE system_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(180) NOT NULL,
    setting_value VARCHAR(2000) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT
);

CREATE UNIQUE INDEX uq_system_settings_live_key ON system_settings(LOWER(setting_key)) WHERE deleted = FALSE;
CREATE INDEX idx_system_settings_state_key ON system_settings(deleted, active, setting_key);

CREATE TABLE translation_messages (
    id BIGSERIAL PRIMARY KEY,
    message_key VARCHAR(250) NOT NULL,
    category VARCHAR(30) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    text_uz_latin VARCHAR(1000) NOT NULL DEFAULT '',
    text_uz_cyrillic VARCHAR(1000) NOT NULL DEFAULT '',
    text_kaa VARCHAR(1000) NOT NULL DEFAULT '',
    text_ru VARCHAR(1000) NOT NULL DEFAULT '',
    text_en VARCHAR(1000) NOT NULL DEFAULT '',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_translation_messages_category CHECK (category IN ('CRM', 'CABINET'))
);

CREATE UNIQUE INDEX uq_translation_messages_live_key_category
    ON translation_messages(LOWER(message_key), category) WHERE deleted = FALSE;
CREATE INDEX idx_translation_messages_state_category_key
    ON translation_messages(deleted, active, category, message_key);

INSERT INTO system_languages(code, name, active, sort_order) VALUES
    ('uz-Latn', 'O''zbekcha', TRUE, 1),
    ('uz-Cyrl', 'Ўзбекча', TRUE, 2),
    ('kaa', 'Qaraqalpaqsha', TRUE, 3),
    ('ru', 'Русский', TRUE, 4),
    ('en', 'English', TRUE, 5);

INSERT INTO system_settings(setting_key, setting_value, active) VALUES
    ('phone-university', '+998', TRUE),
    ('choice-subject-deadline', '1', TRUE),
    ('deadline-re-reading-application', '2026-09-07', TRUE),
    ('practice-subject-deadline', '2026-09-11', TRUE),
    ('config-final-control', '3', TRUE),
    ('credit-standart-hour', '60', TRUE),
    ('grid-pagination-limit', '60', TRUE),
    ('limit-credit-re-reading-application', '60', TRUE),
    ('credit-standart-summ', '9444000', TRUE),
    ('telegram-university', 'https://t.me/', TRUE);

INSERT INTO reference_labels(label_key, label, module_name, active, text_uz_latin, text_en) VALUES
    ('remote', 'Masofaviy', 'education_form', TRUE, 'Masofaviy', 'Distance'),
    ('diurnal', 'Kunduzgi', 'education_form', TRUE, 'Kunduzgi', 'Full-time'),
    ('extramural', 'Sirtqi', 'education_form', TRUE, 'Sirtqi', 'Part-time'),
    ('evening', 'Kechki', 'education_form', TRUE, 'Kechki', 'Evening'),
    ('bakalavr', 'Bakalavr', 'education_type', TRUE, 'Bakalavr', 'Bachelor'),
    ('magistr', 'Magistratura', 'education_type', TRUE, 'Magistratura', 'Master'),
    ('contract', 'Shartnoma asosida', 'edu_payment', TRUE, 'Shartnoma asosida', 'Contract'),
    ('grant', 'Grant asosida', 'edu_payment', TRUE, 'Grant asosida', 'Grant'),
    ('first_statement', '1-qaydnoma', 'statement', TRUE, '1-qaydnoma', 'First statement'),
    ('second_statement', '2-qaydnoma', 'statement', TRUE, '2-qaydnoma', 'Second statement'),
    ('third_statement', '3-qaydnoma', 'statement', TRUE, '3-qaydnoma', 'Third statement'),
    ('four_statement', '4-qaydnoma', 'statement', TRUE, '4-qaydnoma', 'Fourth statement'),
    ('rating', 'Baholash tizimi', 'rating_system', TRUE, 'Baholash tizimi', 'Rating system');

INSERT INTO nationalities(name, active, text_uz_latin, text_en) VALUES
    ('O''zbek', TRUE, 'O''zbek', 'Uzbek'),
    ('Qoraqalpoq', TRUE, 'Qoraqalpoq', 'Karakalpak'),
    ('Qozoq', TRUE, 'Qozoq', 'Kazakh'),
    ('Qirg''iz', TRUE, 'Qirg''iz', 'Kyrgyz'),
    ('Tojik', TRUE, 'Tojik', 'Tajik'),
    ('Turkman', TRUE, 'Turkman', 'Turkmen'),
    ('Rus', TRUE, 'Rus', 'Russian'),
    ('Tatar', TRUE, 'Tatar', 'Tatar'),
    ('Koreys', TRUE, 'Koreys', 'Korean');

INSERT INTO translation_messages(message_key, category, active, text_uz_latin, text_uz_cyrillic, text_kaa, text_ru, text_en) VALUES
    ('Universities', 'CRM', TRUE, 'Universitetlar', 'Университетлар', 'Universitetler', 'Университеты', 'Universities'),
    ('Faculties', 'CRM', TRUE, 'Fakultetlar', 'Факультетлар', 'Fakultetler', 'Факультеты', 'Faculties'),
    ('Name', 'CRM', TRUE, 'Nomi', 'Номи', 'Atı', 'Название', 'Name'),
    ('Status', 'CRM', TRUE, 'Holati', 'Ҳолати', 'Jaǵdayı', 'Статус', 'Status'),
    ('Actions', 'CRM', TRUE, 'Amallar', 'Амаллар', 'Ámeller', 'Действия', 'Actions'),
    ('Create', 'CRM', TRUE, 'Yaratish', 'Яратиш', 'Jaratiw', 'Создать', 'Create'),
    ('Save', 'CRM', TRUE, 'Saqlash', 'Сақлаш', 'Saqlaw', 'Сохранить', 'Save'),
    ('Cancel', 'CRM', TRUE, 'Bekor qilish', 'Бекор қилиш', 'Biykar etiw', 'Отмена', 'Cancel');
