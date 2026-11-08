# O'zgarishlar — 2026-yil noyabr

Bu hujjat 2026-yil oktabr oxiri va noyabrdagi katta o'zgarishlarni qisqa yozadi. Eski `docs/` fayllari sentyabr holatini
aks ettiradi; quyidagilar u yerda yo'q.

## O'quv jarayoni (Everest asosida)
- **O'quv reja** (`/edu-process/curriculum`): fanlar, kredit va soatlar; ishchi o'quv rejani Excel'dan import qilish
  (fanlar, malakaviy amaliyot, YaDA, o'quv jarayoni jadvali, kvalifikatsiya). Tasdiqlangan reja to'g'ridan-to'g'ri
  tahrirlanadi. Semestrlar taxtasi: fan kartasida dastur (📖) va mas'ul o'qituvchi (👤) biriktiriladi.
- **Fan oqimlari (subject groups) butunlay olib tashlandi** (V99). O'qituvchi fani = `teachers.subjects`.
- **O'quv dasturi** (`/admin/syllabi`): dastur → bo'lim (modul) → dars → resurslar (matn, video, hujjat, fayl, havola),
  dars testi va Savol/Javob dasturning o'zida kiritiladi (V91–V96). Muharrir to'liq sahifa (Mentor LMS uslubi).
  Dastur formasida fan tanlanmaydi — fan reja taxtasida biriktiriladi (V104).
- **Talaba kurssiz o'qiydi** (V101): tasdiqlangan dastur bo'lsa fan sahifasi `/student/subjects/:rowId` dastur
  modullari bo'yicha ochiladi; kurs faqat mavjud bo'lsa ko'rsatiladi. "Mening kurslarim" → "Fanlar".
- Dastur mavzularida soat yo'q (V86): soatlar fan bo'yicha o'quv rejada.

## Muhit va ishga tushirish
- Spring profillari: `postgresql` (lokal/dev), `postgresql-prod` (server), ixtiyoriy `hemis-oauth`,
  `hemis-employee-oauth`. Serverda env fayl: `/etc/scorm-lms/scorm-lms.env` (Tomcat systemd `EnvironmentFile`),
  `SPRING_PROFILES_ACTIVE=postgresql-prod` — aynan shu nom (`postgres` emas), qator oxirida `\r` bo'lmasin.
- Baza bilan ishlash standart Spring Boot: Flyway jadvallarni yaratadi (V1→V105), Hibernate `validate` qiladi.
  Profil/baza nomini tekshiradigan qo'shimcha qo'riqchi klasslar (`ActiveProfileGuard`, `ProductionDatabaseGuard`,
  taxallus va avtomatik baza yaratish) olib tashlandi — baza (`scorm_lms`) oldindan yaratilgan bo'lishi kerak:
  `sudo -u postgres createuser --pwprompt scorm_lms && sudo -u postgres createdb --owner scorm_lms scorm_lms`
  (deploy skripti `AUTO_CREATE_DATABASE=true` bo'lsa buni o'zi qiladi).
- `HEMIS_API_TOKEN` faqat muhit o'zgaruvchisidan olinadi — kodda standart qiymat yo'q.
  **Token git tarixiga tushgan — HEMIS tomonida bekor qilib yangisini oling.**
- Email: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `APP_MAIL_FROM`, `APP_FRONTEND_URL`
  (`.env.example`). `MAIL_HOST` bo'sh bo'lsa xat yuborilmaydi, faqat log yoziladi.
- Production loglari `LOG_FILE` (standart `/var/log/scorm-lms/app.log`) ga yoziladi, 50 MB / 30 kun aylanadi.
- Nginx namunasi (`ops/deploy/nginx-scorm-lms.conf.example`) endi HTTPS (Let's Encrypt) bilan.

## Foydalanuvchi interfeysi
- Holatlar o'zbekcha (`frontend/src/lib/status-labels.ts` → `statusLabel()`); yangi joyda xom `DRAFT`/`APPROVED`
  ko'rsatmang.
- O'quv yili ro'yxatdan tanlanadi (`components/academic-year-select.tsx`), qo'lda yozilmaydi.
- Menyu nomlari oddiy o'zbekcha ("Bosh sahifa", "Qaydnomalar (vedomost)", "Harakatlar jurnali").

## Migratsiyalar
- V86–V105 (oktabr–noyabr). V99 fan oqimlari jadvallarini qaytarib bo'lmaydigan tarzda o'chiradi.
