# Xavfsizlik va yuklama tekshiruvi

Ushbu runbook MON-06 tekshiruvlarini lokal, staging yoki izolatsiyalangan test muhitida takrorlash uchun mo'ljallangan. Ruxsatsiz production tizimiga faol skan, brute-force yoki yuklama testi yuborilmaydi.

## 1. Avtomatlashtirilgan xavfsizlik testlari

```powershell
.\gradlew.bat test --tests "uz.scorm.lms.app.security.*"
```

Testlar security header/CORS, auth rate limit, proxy IP ishonch chegarasi, audit redaction, parol siyosati, reset-token hashing va parol o'zgarganda refresh sessiyalar bekor qilinishini qamrab oladi.

## 2. Backend dependency auditi

OSV internet servisi ishlatiladi. Skript Gradle'ning resolved `runtimeClasspath` grafigini oladi; faqat `build.gradle` dagi bevosita paketlar bilan cheklanmaydi.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File `
  .\ops\security\invoke-backend-osv-audit.ps1 `
  -ReportPath docs\evidence\backend-osv-audit.json `
  -FailOnSeverity Critical
```

`-FailOnSeverity High` berilsa high va critical topilmalarda ham jarayon xato kodi bilan tugaydi.

## 3. Frontend dependency auditi

```powershell
Set-Location frontend
npm.cmd audit --omit=dev
```

2026-08-06 holatida qolgan React Router advisory faqat unstable RSC/Server Action rejimiga tegishli. Loyiha esa React 18 `BrowserRouter` SPA bo'lib, RSC, SSR va Server Action ishlatmaydi. React Router 8.3 xavfsizlik patchi React 19.2.7 va Node 22.22 bazasini talab qilgani sababli bu major migratsiya alohida compatibility bosqichida bajariladi; 7.x patch chiqishi har release oldidan qayta tekshiriladi.

## 4. HTTP yuklama smoke testi

Avval backendni kerakli test konfiguratsiyasi bilan ishga tushiring. So'ng standart health profilini bajaring:

```powershell
$env:LOAD_BASE_URL = "http://127.0.0.1:8080"
$env:LOAD_PATH = "/actuator/health"
$env:LOAD_EXPECTED_STATUS = "200"
$env:LOAD_REQUESTS = "2000"
$env:LOAD_CONCURRENCY = "50"
$env:LOAD_MAX_P95_MS = "500"
$env:LOAD_MAX_ERRORS = "0"
$env:LOAD_REPORT_PATH = "docs/evidence/http-load-health.json"
node.exe .\ops\performance\http-load-smoke.mjs
```

Security filter zanjirini tekshirish uchun himoyalangan endpointga tokensiz so'rov yuborish mumkin:

```powershell
$env:LOAD_PATH = "/api/v1/users"
$env:LOAD_EXPECTED_STATUS = "401"
$env:LOAD_REQUESTS = "1000"
$env:LOAD_CONCURRENCY = "30"
$env:LOAD_REPORT_PATH = "docs/evidence/http-load-protected.json"
node.exe .\ops\performance\http-load-smoke.mjs
```

Natijada status taqsimoti, transport xatolari, RPS va `p50/p95/p99/max` latency yoziladi. Bu smoke/baseline testi capacity planning o'rnini bosmaydi: productionga yaqin staging muhitida real o'qish/yozish ssenariylari, monitoring va DB metrikalari bilan uzoqroq test alohida o'tkaziladi.

## Production nazoratlari

- `TRUSTED_PROXY_IPS` faqat haqiqiy reverse-proxy ichki IP manzillarini oladi; bo'sh qiymatda `X-Forwarded-For` ishonchsiz hisoblanadi.
- Ilova ichidagi auth rate-limit har bir instance uchun himoya backstopidir. Ko'p instanceli productionda ingress/API gateway darajasida ham global limit majburiy.
- `APP_SEED_*_PASSWORD` odatda bo'sh turadi va vaqtincha berilganda kamida 12 belgili siyosatga mos bo'ladi.
- `SWAGGER_ENABLED=false`, aniq HTTPS CORS originlari va tasodifiy kamida 64 baytli `JWT_SECRET` ishlatiladi.
- Penetration testi faqat yozma scope, ruxsat etilgan manzillar, vaqt oynasi, trafik limiti va rollback/aloqa rejasi bilan o'tkaziladi.
