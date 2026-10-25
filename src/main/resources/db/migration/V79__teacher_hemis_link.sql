-- O'qituvchini HEMIS xodim akkaunti bilan bog'lash (HEMIS orqali kirish uchun)
ALTER TABLE teachers ADD COLUMN hemis_employee_id VARCHAR(64);
ALTER TABLE teachers ADD COLUMN hemis_login VARCHAR(150);
CREATE UNIQUE INDEX uq_teachers_hemis_employee_id ON teachers(hemis_employee_id) WHERE hemis_employee_id IS NOT NULL AND deleted = FALSE;
CREATE UNIQUE INDEX uq_teachers_hemis_login ON teachers(LOWER(hemis_login)) WHERE hemis_login IS NOT NULL AND deleted = FALSE;
