-- O'quv dasturi fansiz yaratiladi; fan o'quv reja taxtasida dastur biriktirilganda yoziladi (dasturga va uning materiallariga)
ALTER TABLE subject_syllabi ALTER COLUMN subject_id DROP NOT NULL;
ALTER TABLE subject_materials ALTER COLUMN subject_id DROP NOT NULL;
