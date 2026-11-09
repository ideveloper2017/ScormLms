-- O'quv dasturi muqova rasmi va tanishtiruv videosi (fayl yoki havola) — talaba fan sahifasida ko'rinadi
ALTER TABLE subject_syllabi ADD COLUMN cover_image VARCHAR(64);
ALTER TABLE subject_syllabi ADD COLUMN intro_video VARCHAR(64);
ALTER TABLE subject_syllabi ADD COLUMN intro_video_name VARCHAR(500);
ALTER TABLE subject_syllabi ADD COLUMN intro_video_url VARCHAR(1000);
