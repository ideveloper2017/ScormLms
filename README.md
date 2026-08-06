# ScormLms

559-son qaror talablariga moslashtirilayotgan SCORM LMS: Kotlin/Spring Boot backend va React/Vite frontend.

Amaldagi implementatsiya holati va keyingi ishlar [qaror bo'yicha rejada](docs/decision-559-implementation-plan.md) yuritiladi.

## Lokal ishga tushirish

Talablar: Java 21+, PostgreSQL va Node.js 22.12+ (yoki 20.19+).

1. PostgreSQL'da `scorm_lms` bazasini yarating.
2. `.env.example` dan kerakli qiymatlarni IDE/terminal environment'iga kiriting. Spring Boot `.env` faylini o'zi avtomatik o'qimaydi.
3. Backendni ishga tushiring:

   ```powershell
   .\gradlew.bat bootRun
   ```

4. Frontendni ishga tushiring:

   ```powershell
   Set-Location frontend
   npm install
   npm run dev
   ```

Development profilining standart bazasi `jdbc:postgresql://localhost:5432/scorm_lms`, foydalanuvchi/paroli `postgres/postgres`. Haqiqiy credentiallarni repozitoriyga yozmang.

## Production environment

Backend uchun majburiy qiymatlar:

- `SPRING_PROFILES_ACTIVE=postgresql-prod`
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET` — kamida 64 baytlik tasodifiy secret
- `CORS_ALLOWED_ORIGINS` — aniq HTTPS originlar, wildcard emas
- `FILE_UPLOAD_DIR`, `SCORM_STORAGE_DIR` va `ASSIGNMENT_STORAGE_DIR` — backup qilinadigan persistent kataloglar
- `SCORM_SECURE_COOKIE=true`

HEMIS ishlatilsa `HEMIS_HOST`, `HEMIS_ADMIN_LOGIN`, `HEMIS_ADMIN_PASSWORD` ham beriladi. `APP_SEED_ADMIN_PASSWORD`, `APP_SEED_TEACHER_PASSWORD` va `APP_SEED_STUDENT_PASSWORD` faqat tegishli boshlang'ich foydalanuvchi kerak bo'lganda vaqtincha beriladi; kod ichida standart parol yo'q. Productionda `SWAGGER_ENABLED=false` tavsiya etiladi.

Frontend environment qiymatlari build vaqtida olinadi; ular [frontend/.env.example](frontend/.env.example) da ko'rsatilgan. `VITE_SCORM_CONTENT_ORIGIN` frontend originidan alohida bo'lishi kerak, masalan `https://scorm.example.uz`.

## Tekshiruvlar

```powershell
.\gradlew.bat test
Set-Location frontend
npm run build
npm run test:run
npm audit
```

SCORM paketlari va upload kataloglari Git'ga kiritilmaydi; deploymentda alohida saqlash, backup va restore siyosati talab qilinadi.

PostgreSQL, upload, SCORM va assignment storage uchun atomar backup, xavfsiz restore va disposable drill tartibi [backup/restore runbookida](docs/backup-restore-runbook.md) berilgan. Amaliy skriptlar `ops/backup` katalogida joylashgan.
