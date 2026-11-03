-- Mavjud kurslar: darslarning umumiy tartibi modullar tartibiga ergashadi (modul ichida nisbiy tartib saqlanadi,
-- modulga biriktirilmaganlar oxirida) — talaba ko'rinishi va kontent ro'yxati shu tartibda.
UPDATE course_modules cm
SET position = ordered.rn
FROM (
    SELECT lesson.id,
           ROW_NUMBER() OVER (
               PARTITION BY lesson.course_id
               ORDER BY (unit.id IS NULL), unit.position, lesson.position, lesson.id
           ) AS rn
    FROM course_modules lesson
    LEFT JOIN course_units unit ON unit.id = lesson.unit_id AND unit.deleted = FALSE
    WHERE lesson.deleted = FALSE
) ordered
WHERE ordered.id = cm.id
  AND cm.position <> ordered.rn;
