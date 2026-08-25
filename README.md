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
- `FILE_UPLOAD_DIR`, `SCORM_STORAGE_DIR`, `ASSIGNMENT_STORAGE_DIR`, `COURSE_CONTENT_STORAGE_DIR` va `UAT_PRIVATE_STORAGE_DIR` — backup qilinadigan persistent kataloglar; kurs kontenti va UAT kataloglari public static route orqali berilmaydi
- `SCORM_SECURE_COOKIE=true`

HEMIS ishlatilsa `HEMIS_HOST`, `HEMIS_ADMIN_LOGIN`, `HEMIS_ADMIN_PASSWORD` ham beriladi. Dastlab `/admin/integrations` ekranida HEMIS guruhlarini lokal guruhlarga mapping qiling; tekshiruvdan keyingina `HEMIS_SYNC_ENABLED=true` bilan davriy worker ochiladi. Interval `HEMIS_SYNC_CRON`, sahifa hajmi `HEMIS_SYNC_PAGE_SIZE` orqali sozlanadi. `APP_SEED_ADMIN_PASSWORD`, `APP_SEED_TEACHER_PASSWORD` va `APP_SEED_STUDENT_PASSWORD` faqat tegishli boshlang'ich foydalanuvchi kerak bo'lganda vaqtincha beriladi; kod ichida standart parol yo'q. Productionda `SWAGGER_ENABLED=false` tavsiya etiladi.

HEMIS OAuth2 login alohida `hemis-oauth` Spring profili bilan yoqiladi: masalan, `SPRING_PROFILES_ACTIVE=postgresql-prod,hemis-oauth`. HEMIS bergan `HEMIS_OAUTH_CLIENT_ID`, `HEMIS_OAUTH_CLIENT_SECRET`, authorization/token/user-info endpointlari, scope, backend callback (`HEMIS_OAUTH_REDIRECT_URI`) va frontend callback URL sozlanadi. `HEMIS_OAUTH_REDIRECT_URI` HEMIS tomonida aynan ro'yxatdan o'tkazilgan HTTPS `/login/oauth2/code/hemis` manzili bo'lishi kerak. OAuth login yangi akademik profil yaratmaydi: HEMIS `id` yoki `login` qiymati oldindan sync/import qilingan faol talaba bilan mos tushishi shart. Provider access tokeni brauzerga chiqmaydi; frontendga faqat 60 soniyalik, bir marta ishlatiladigan exchange kodi qaytadi.

Videokonferensiya uchun provider credentiali brauzerga berilmaydi. Tashkilot adapteri `VIDEO_CONFERENCE_PROVISION_URL`, `VIDEO_CONFERENCE_PROVIDER_CODE` va `VIDEO_CONFERENCE_TOKEN` bilan sozlanadi. LMS adapterga `POST` orqali `sessionId`, `title`, `startsAt`, `endsAt`, `idempotencyKey` yuboradi va `meetingId`, `joinUrl`, `hostUrl` kutadi; bekor qilish shu URLning `/{meetingId}` manziliga `DELETE` bilan yuboriladi. Har ikkala so'rovda `Authorization: Bearer ...` va `Idempotency-Key` bor. Sozlama bo'lmasa provisioning fail-closed bo'lib, sintetik meeting yaratilmaydi.

Frontend environment qiymatlari build vaqtida olinadi; ular [frontend/.env.example](frontend/.env.example) da ko'rsatilgan. `VITE_SCORM_CONTENT_ORIGIN` frontend originidan alohida bo'lishi kerak, masalan `https://scorm.example.uz`.

## Tekshiruvlar

```powershell
.\gradlew.bat test
Set-Location frontend
npm run build
npm run test:run
npm audit
```

SCORM paketlari, upload va xususiy UAT dalil kataloglari Git'ga kiritilmaydi; deploymentda alohida saqlash, backup va restore siyosati talab qilinadi.

GitHub Actions orqali Ubuntu VPS, Nginx va tashqi Tomcat'ga CI/CD sozlash tartibi [CI/CD runbookida](docs/cicd-ubuntu-vps.md) berilgan.

PostgreSQL, upload, SCORM, assignment va xususiy UAT dalil storage'i uchun atomar backup, xavfsiz restore va disposable drill tartibi [backup/restore runbookida](docs/backup-restore-runbook.md) berilgan. Amaliy skriptlar `ops/backup` katalogida joylashgan.

559 UAT dalil kiritish paneli `GET /api/v1/compliance/559/uat/requirements` orqali buildga paketlangan yagona `docs/uat/decision-559-uat-evidence.json` katalogidan band nomi, baseline holati, tavsiya etilgan mas'ul, texnik dalil manbalari, `DEP-*` bog'liqligi va qolgan manual ishni ko'rsatadi. Backend katalogni ishga tushishda aynan 27 band va tasdiqlangan qaror PDF SHA-256 qiymati bo'yicha fail-fast tekshiradi.

Static intake katalogi schema-v2da 14 `PARTIAL` band uchun jami 43 ta aniq `manualEvidence` topshirig'ini saqlaydi; automated bandlarga manual topshiriq yozilmaydi. `GET /api/v1/compliance/559/uat/requirements/manual-evidence-pack` ularni qaror SHA, band, mas'ul, `DEP-*` va to'ldirish ustuni bilan print-friendly HTMLda detached SHA orqali eksport qiladi; shu pack runtime panelidan ham yuklanadi.

Yangi/tahrirlanadigan runtime run schema-v5 kontraktida ishlaydi: katalogdagi `PARTIAL` band `AUTOMATED_PASS` yoki `NOT_APPLICABLE` bilan yopilmaydi, final holat faqat bandning barcha checklistlari va kamida bitta haqiqiy private PDF/PNG/JPEGga ega `MANUAL_PASS` bo'ladi. Qoplangan checklist matnlari manifest va canonical `evidenceSetSha256` tarkibiga kiradi; reviewer aynan shu ro'yxatni ko'radi. Runtime verifier tasdiqlangan schema-v2 katalogdagi matn/tartibni ham aynan solishtiradi; `ops/uat/test-decision-559-runtime-manifest-v5.ps1` 27 band/43 checklist musbat fixtureini hamda missing-coverage, qayta hashlangan soxta matn va hash-tamper rad etilishini tekshiradi.

V52 real dalil yig'ishni progressiv qiladi: `PARTIAL` yoki `BLOCKED_EXTERNAL` bandda hozircha qaytgan checklistlar real private fayl bilan saqlanadi, oxirgi fayl o'chirilsa qamrov ham tozalanadi. Run va runtime manifest `manualEvidenceCoveredCount/43` hamda final mustaqil qabul qilingan `manualEvidenceAcceptedCount/43`ni beradi. Non-final natijaga `ACCEPTED` review berilmaydi; barcha topshiriq qaytgach band `MANUAL_PASS`ga o'tkaziladi.

V53 har bir schema-v5 run uchun 43 qatorli operatsion monitoringni beradi: har topshiriq `PENDING`, `COLLECTED` yoki `ACCEPTED` bo'lib katalog qamrovi va mustaqil reviewdan serverda hisoblanadi. UI mas'ul, tashqi bog'liqlik va fayl sonini ko'rsatadi; private CSV eksport detached SHA-256 bilan yuklanadi.

V54 monitoringdagi har bir manual topshiriqqa mas'ul bo'lim yoki shaxs, kelajakdagi muddat va kuzatuv izohini audit bilan biriktiradi. Koordinatsiya faqat tahrirlanadigan run va `UAT_WRITE` vakolatida saqlanadi, muddati o'tgan topshiriqlar UI/CSVda ajratiladi; bu metadata evidence holati yoki imzolanadigan canonical hashni o'zgartirmaydi.

V55 tayinlangan/tayinlanmagan/overdue hisoblarini beradi va hali koordinatsiya qilinmagan topshiriqlarni katalogdagi tavsiya etilgan bo'limlarga umumiy muddat hamda izoh bilan atomar taqsimlaydi. Avvalgi individual tayinlovlar o'zgarmaydi, takror bulk yopiladi va koordinatsiya canonical evidence-set SHAga ta'sir qilmaydi.

V56 talabani yaratishni ikki sodda amalga ajratadi: avval faqat shaxsiy kartochka `REGISTERED` holatda saqlanadi, keyin registrar alohida `O'qishga biriktirish` formasida dastur, guruh, kontrakt va qabul buyrug'ini kiritadi. Muvaffaqiyatli qabuldan keyingina talaba `ACTIVE` bo'ladi va login ochiladi.

V58 shaxsiy kartochkani akademik formaga tegmasdan kengaytiradi: otasining ismi, telefon/email, fuqarolik, pasport rekvizitlari, foto URL, doimiy va hozirgi manzil create/editda alohida bloklarda yuritiladi. Personal yangilash alohida endpointda to'liq almashtirish semantikasi, format validatsiyasi va normalizatsiya bilan ishlaydi.

V59 akademik qabulni `o'quv yili -> dastur -> semestr -> guruh` kaskadiga o'tkazadi. Semestr talaba yozuvida saqlanadi, kurs avtomatik hisoblanadi va guruhning dastur, o'quv yili hamda ta'lim tiliga mosligi frontend va backendda tekshiriladi.

V60 talaba reyestrini server-side qidiruv, status filtri va paginationga o'tkazadi. Excel eksport `USER_READ + REPORT_READ` bilan himoyalangan, JSHSHIR/telefon/emailni maskalaydi, pasport/manzilni chiqarmaydi, 10 000 qator bilan cheklanadi va PII kiritmasdan auditlanadi.

V64 talaba geografiya klassifikatorlarini versiyalaydi: buildga paketlangan manifest 249 ISO 3166-1 mamlakat kodi, CLDR 48.2.0 o'zbekcha nomi, 14 SOATO hududi va 206 tuman/shaharni saqlaydi. `/admin/student-classifiers` sahifasida `ACADEMIC_READ` manba/versiya/SHA-256 va oxirgi importni ko'radi, `ACADEMIC_WRITE` esa faqat shu tekshirilgan paketni idempotent import qiladi. Takror import dublikat yaratmaydi; local admin yozuvlari saqlanadi.

V65 PostgreSQL migratsiya/import UATini takrorlash uchun `PGPASSWORD` va zarur bo'lsa `POSTGRES_BIN` berib `powershell.exe -NoProfile -ExecutionPolicy Bypass -File ops/classifiers/invoke-geography-classifier-uat.ps1` ishga tushiriladi. Skript faqat qat'iy prefiksli disposable baza yaratadi, V52→V53 upgrade, legacy student FK, local yozuv va ikkinchi no-op importni tekshiradi, bazani `finally`da o'chiradi hamda `docs/uat` ostida JSON + detached SHA-256 dalil beradi.

27 bandning barchasi final natija va mustaqil `ACCEPTED` reviewga yetgach `GET /api/v1/compliance/559/uat/runs/{id}/protocol/draft` joriy run ID, qaror SHA, schema, canonical evidence-set SHA va barcha band natijalari oldindan yozilgan print-friendly HTMLni detached SHA bilan beradi. Uni PDFga chop etib komissiya imzolaydi; evidence-ready holatgacha draft ham, imzolangan protocol uploadi ham serverda bloklanadi.

Yakuniy 559 UAT runidan eksport qilingan audit manifestini (legacy final runlar uchun schema-v2/v3/v4, checklist qamrovi bog'langan yangi runlar uchun schema-v5) detached HTTP SHA bilan tekshirish:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ops/uat/verify-decision-559-runtime-manifest.ps1 `
  -ManifestPath .\decision-559-uat-run-<RUN_ID>-manifest.json `
  -ExpectedSha256 <X-Content-SHA256> -RequireReady -RequireApproved
```

`APPROVED` running manifesti, private dalillari, imzolangan protokoli va `SHA256SUMS` faylini bitta ZIPda tekshirish:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ops/uat/verify-decision-559-acceptance-bundle.ps1 `
  -BundlePath .\decision-559-uat-run-<RUN_ID>-acceptance-bundle.zip `
  -ExpectedSha256 <BUNDLE-X-Content-SHA256> `
  -ReportPath .\decision-559-acceptance-bundle-verification.json
```
