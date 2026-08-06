# 559-son qaror bo'yicha amalga oshirish rejasi

> Ushbu hujjat loyiha davomida yangilanadigan asosiy ish rejasidir. Har bir bajarilgan ishning holati, tekshiruv natijasi va muhim qarori shu faylga yozib boriladi.

## Hujjat ma'lumotlari

| Maydon | Qiymat |
|---|---|
| Manba | Vazirlar Mahkamasining 2022-yil 3-oktabrdagi 559-son qarori |
| Holat | Faol |
| Oxirgi yangilanish | 2026-08-06 |
| Asosiy moslik hujjati | `docs/decision-559-alignment.md` |
| Holat belgilari | `BAJARILDI`, `JARAYONDA`, `REJADA`, `BLOKLANGAN` |

## Maqsad

LMSni 559-son qarorda ko'rsatilgan masofaviy ta'lim talablari bo'yicha ishlaydigan, tekshiriladigan va audit qilinadigan holatga keltirish. Texnik tayyorlik bilan birga tashkiliy va tashqi integratsiya talablari ham alohida nazorat qilinadi.

## Yakunlangan bazaviy moslashtirish

| ID | Band | Ish | Holat | Tekshiruv |
|---|---:|---|---|---|
| BASE-01 | 10 | SCORM 1.2 va SCORM 2004 ZIP importi, manifest tahlili va runtime API | BAJARILDI | Backend kompilyatsiyasi o'tdi |
| BASE-02 | 10 | SCORM natijasi, progressi, holati va sarflangan vaqtni saqlash | BAJARILDI | Runtime endpointlari kompilyatsiyadan o'tdi |
| BASE-03 | 10-11 | SCORM kontentini frontend tokenlaridan alohida origin va runtime bridge orqali ajratish | BAJARILDI | TypeScript tekshiruvida yangi SCORM fayllarida xato yo'q |
| BASE-04 | 17, 20 | Masofaviy yo'nalish uchun litsenziya, til, qabul limiti va IT istisnosi | BAJARILDI | 559-son qoidalari testlari 3/3 o'tdi |
| BASE-05 | 20 | Bakalavriat 300 va magistratura 30 limitlarini qabulda tekshirish | BAJARILDI | Unit test mavjud |
| BASE-06 | 20 | Xorijiy talabalarni mahalliy qabul limitidan chiqarish | BAJARILDI | Repository va service qoidasi mavjud |
| BASE-07 | 26 | Faol o'qituvchi-talaba nisbatini 1:50 bilan cheklash | BAJARILDI | Qabul va compliance service tekshiradi |
| BASE-08 | 28-31 | 559-son qaror compliance API va admin paneli | BAJARILDI | Route va frontend sahifa yaratildi |
| BASE-09 | 11 | Refresh token rotatsiyasi va HEMIS login token oqimini birxillashtirish | BAJARILDI | Backend kompilyatsiyasi o'tdi |
| BASE-10 | 11 | WebSocket JWT nazorati va biometrik ma'lumotga IDOR himoyasi | BAJARILDI | Backend kompilyatsiyasi o'tdi |
| BASE-11 | Production | Production profilda majburiy JWT secret va xavfsiz SCORM cookie | BAJARILDI | Konfiguratsiya yangilandi |

## Amalga oshirish bosqichlari

### 1-bosqich. Barqarorlashtirish va ma'lumotlar bazasi - P0

Maqsad: hozirgi moslashtirishni qayta ishlab chiqariladigan build, migratsiya va avtomatik testlar bilan productionga tayyorlash.

| ID | Ish | Holat | Qabul mezoni |
|---|---|---|---|
| STAB-01 | Barcha mavjud entitylar, Program va SCORM jadvallari uchun Flyway baseline migratsiyasini yozish | BAJARILDI | Bo'sh schema migratsiyasi va `ddl-auto=validate` testi o'tdi; PostgreSQL 16 Testcontainers smoke-testi CI uchun qo'shildi |
| STAB-02 | SCORM import, Zip Slip, manifest va runtime uchun service testlar | BAJARILDI | SCORM 1.2/2004, ownership, Zip Slip, manifestsiz/hajmi katta ZIP, runtime va urinish egasi bo'yicha 8/8 test o'tdi |
| STAB-03 | Talaba qabul limitlari va 1:50 qoidasi uchun service testlari | BAJARILDI | 300/30, IT, xorijiy talaba, kontrakt, til va 1:50 chegaralari bo'yicha 8/8 test o'tdi |
| STAB-04 | Frontenddagi mavjud TypeScript build xatolarini yopish | BAJARILDI | `npm run build` exit code 0; 3742 modul production bundle'ga yig'ildi |
| STAB-05 | Mavjud frontend testlaridagi 20 ta xatoni tahlil qilish va tuzatish | BAJARILDI | 23 test fayli va 361/361 test muvaffaqiyatli o'tdi |
| STAB-06 | Dependency zaifliklarini saralash va xavfsiz versiyalarga yangilash | BAJARILDI | Audit 24 tadan 2 taga tushdi: critical/moderate/low 0; qolgan 2 high bitta React Router RSC advisory zanjiri bo'yicha hujjatlashtirildi |
| STAB-07 | Development va production environment shablonlarini to'ldirish | BAJARILDI | Backenddagi 17 ta va frontenddagi 3 ta faol env qiymati README hamda `.env.example` fayllarida to'liq hujjatlashtirildi |
| STAB-08 | Haqiqiy namunaviy SCORM paket bilan end-to-end sinov | BAJARILDI | Ishlaydigan SCORM 1.2 va 2004 sample PIFlar bilan import, launch/content, commit, finish va qayta ochish 2/2 ssenariyda o'tdi |

### 2-bosqich. Masofaviy o'quv jarayonining to'liq modeli - P0

Maqsad: 11 va 24-bandlarda sanab o'tilgan kurs, kontent, topshiriq, nazorat va individual natijalarni real ma'lumotlar bazasiga o'tkazish.

| ID | Band | Ish | Holat | Qabul mezoni |
|---|---:|---|---|---|
| EDU-01 | 11, 24 | Kurs, modul va kontent uchun to'liq CRUD va holatlar | BAJARILDI | Course/module/ordinary content CRUD, tartib, draft/publish/archive, owner/admin vakolati va teacher UI real bazada ishlaydi |
| EDU-02 | 11 | Talabani kursga biriktirish va kontingent reestri | BAJARILDI | V2 enrollment reestri, teacher UI va SCORM launch access tekshiruvi mavjud; biriktirilmagan talaba bloklanadi |
| EDU-03 | 11 | Individual o'quv reja va fanlar kesimidagi progress | BAJARILDI | Enrollmentdagi o'quv yili, semestr, kredit va fan turi asosida individual reja ko'rinadi; progress nashrdagi oddiy kontent va oxirgi SCORM paketidan avtomatik hisoblanadi |
| EDU-04 | 11, 24 | Resursdan foydalanish asosidagi davomat hodisalari | BAJARILDI | O'qituvchi belgilagan vaqt oynasidagi oddiy kontent va SCORM hodisalaridan present/late/absent hisoblanadi; login hodisasi davomat hisoblanmaydi |
| EDU-05 | 11, 24 | Topshiriq, fayl topshirish, deadline va baholash | BAJARILDI | Teacher kurs topshirig'ini nashr qiladi; enrolled talaba matn/fayl topshiradi; server deadline va urinishni audit qiladi; o'qituvchi maksimal ball doirasida baholaydi, talaba natija va feedbackni ko'radi |
| EDU-06 | 11, 24 | Test savollari banki, urinishlar va baholash qoidalari | BAJARILDI | O'qituvchi kurs savollari bankidan vaqt, urinish va o'tish qoidali test nashr qiladi; enrolled talaba javob kalitisiz test ishlaydi; server urinish, javob, ball va natijani audit izi bilan saqlaydi |
| EDU-07 | 11 | Sinxron va asinxron mashg'ulotlarni kursga bog'lash | BAJARILDI | Teacher kursga vaqt va lifecycle bilan jonli yoki mustaqil mashg'ulot nashr qiladi; enrolled student real haftalik jadvaldan server vakolati orqali live, yozuv yoki resursni ochadi; kirish hodisasi audit va davomat faolligiga yoziladi |
| EDU-08 | 21 | Semestr yakuniy nazoratini shaxsan qatnashish bilan qayd etish | BAJARILDI | V8 migratsiya; publish paytida muzlatilgan roster; server tasdiqlagan auditoriya davomati; faqat qatnashganga server hisoblagan baho; completion gate; student natijasi va 10 kunlik apellyatsiya; teacher/student real UI hamda integratsion testlar |
| EDU-09 | 21 | Davlat attestatsiyasi va bitiruv nazorat jurnali | BAJARILDI | V9 migratsiya; avtomatik rais va muzlatilgan roster; komissiya a'zolarining server-side o'rtacha/qarori; completion gate; akademik administrator tasdiqlaydigan noyob DAK protokoli; faqat tasdiqlangan protokoldan sertifikat; RBAC/IDOR; teacher/student UI va workflow testi |

### 3-bosqich. Avtoproktoring va biometrik boshqaruv - P0

| ID | Band | Ish | Holat | Qabul mezoni |
|---|---:|---|---|---|
| PROC-01 | 10-11 | Imtihon sessiyasi uchun yuz va faol harakat tekshiruvi | BAJARILDI | V13 bir martalik server challenge, serverda aynan bitta yuz/identity/movement tekshiruvi, SHA-256 kadr izi va quiz attemptga atomar consume ishlaydi; frontend random demo o'rniga real preflightdan foydalanadi |
| PROC-02 | 10-11 | Kamera, tab almashtirish va uzilish hodisalari jurnali | BAJARILDI | V14 event journal attempt/sessionga bog'langan; server start/end, kamera, visibility/fokus, network, heartbeat/page-exit hodisalari vaqt, server-derived risk, source va UUID dedup bilan saqlanadi |
| PROC-03 | 10-11 | Proktor monitoring paneli va dalillar oynasi | BAJARILDI | V15 orqali quizga aniq proktor biriktiriladi; biriktirilgan proktor, kurs egasi yoki global vakolatli rolgina sessiya, risk hodisasi va attempt dalillarini ko'radi |
| PROC-04 | 10-11 | Biometrik rozilik, saqlash muddati va o'chirish siyosati | BLOKLANGAN | Universitetning tasdiqlangan maxfiylik siyosati talab qilinadi |
| PROC-05 | 10-11 | Apellyatsiya va qo'lda qayta ko'rib chiqish oqimi | BAJARILDI | V16 bir attemptga bitta 10 kunlik appeal, tanlangan risk event referenslari, assignment scope'li manual review va o'zgarmas yakuniy qarorni saqlaydi; asl event va ball o'zgarmaydi |

### 4-bosqich. Elektron kontent sifati va O'zDSt 36.2030 - P1

| ID | Band | Ish | Holat | Qabul mezoni |
|---|---:|---|---|---|
| CONT-01 | 8-9 | Kontent metadata, til, muallif, versiya va amal qilish davri | BAJARILDI | V17 har materialga til, muallif, noyob versiya, manba va amal qilish davrini majburiy qiladi; o'zgarmas revision tarixi saqlanadi, student va progress faqat amaldagi kontentni ko'radi |
| CONT-02 | 8-9 | Ekspertiza va tasdiqlash workflow | BAJARILDI | V18 revisionga bog'langan ekspertiza navbati, mustaqil `ACADEMIC_WRITE` qarori, asosli tuzatishga qaytarish va immutable tarixni saqlaydi; faqat tasdiqlangan joriy revision publish qilinadi |
| CONT-03 | 8-9 | O'zDSt checklist va tasdiqlovchi hujjatlar reestri | BLOKLANGAN | Standartning rasmiy to'liq nusxasi va tashkilot checklisti kerak |
| CONT-04 | 8 | Har fan bo'yicha yillik kontent to'liqligi hisoboti | REJADA | Fanlar kesimida yetishmayotgan materiallar ko'rsatiladi |
| CONT-05 | 18 | Kontent tili va ta'lim dasturi mosligini tekshirish | REJADA | Noto'g'ri til/dasturdagi kontent publish qilinmaydi |

### 5-bosqich. Kommunikatsiya va qo'llab-quvvatlash - P1

| ID | Band | Ish | Holat | Qabul mezoni |
|---|---:|---|---|---|
| COMM-01 | 11 | Kurs forumi va mavzular | REJADA | Talaba va o'qituvchi kurs doirasida muloqot qiladi |
| COMM-02 | 11 | Shaxsiy va guruh chatlari | REJADA | Xabarlar vakolat va audit bilan saqlanadi |
| COMM-03 | 11 | E'lon, email/push xabarnoma va o'qilganlik holati | REJADA | Muhim e'lon yetkazilgani nazorat qilinadi |
| COMM-04 | 11 | Videokonferensiya provayderi integratsiyasi | BLOKLANGAN | Provayder va litsenziya tanlovi kerak |
| COMM-05 | 8 | Texnik yordam murojaatlari va SLA hisoboti | REJADA | Ticket holati, mas'ul va yechim vaqti ko'rinadi |

### 6-bosqich. Vazirlik va sifat nazorati integratsiyalari - P1

| ID | Band | Ish | Holat | Qabul mezoni |
|---|---:|---|---|---|
| INT-01 | 29 | Vazirlik tizimi bilan ma'lumot almashish adapteri | BLOKLANGAN | Rasmiy API spetsifikatsiyasi va test muhiti kerak |
| INT-02 | 29 | Ta'lim sifatini nazorat qilish tizimi adapteri | BLOKLANGAN | Rasmiy API spetsifikatsiyasi va credential kerak |
| INT-03 | 29 | Outbox, retry va idempotency mexanizmi | REJADA | Vaqtinchalik uzilishda ma'lumot yo'qolmaydi |
| INT-04 | 29 | Integratsiya auditi va xatolar monitoringi | REJADA | Yuborilgan/qabul qilingan yozuvlar kuzatiladi |
| INT-05 | 28-31 | HEMIS ma'lumotlarini davriy sinxronlash | REJADA | Dublikat va konfliktlar boshqariladi |

### 7-bosqich. Monitoring, hisobot va foydalanishga topshirish - P1

| ID | Band | Ish | Holat | Qabul mezoni |
|---|---:|---|---|---|
| MON-01 | 28-31 | Compliance holatini statik emas, real modul metrikalaridan hisoblash | BAJARILDI | 15 ta real/aniq mavjud emas dalili, o'lchash vaqti, source, status va modul drill-down qo'shildi; repository qiymatlari integratsion test bilan tekshirildi |
| MON-02 | 28-31 | Kamchilik, mas'ul, deadline va tuzatish rejasi | BAJARILDI | V11 issue reestri, mas'ul/deadline/reja, auditli lifecycle, yechim dalili, overdue va real buzilish yo'qolmaguncha yopishni bloklash ishlaydi |
| MON-03 | 28-31 | Talaba va pedagog so'rovlari | BAJARILDI | V12 survey lifecycle, auditoriya, HMAC duplicate nazorati, identifikatorsiz response/audit, kamida 5 respondentli agregat natija va admin/participant UI ishlaydi |
| MON-04 | 11, 28 | Kontingent, o'zlashtirish, kontent va faollik hisobotlari | BAJARILDI | Real kontingent/kurs/o'zlashtirish/davomat/kontent/SCORM/faollik agregatlari, sana filtri, server-side CSV/XLSX eksport, audit va teacher/tashkilot RBAC ishlaydi |
| MON-05 | Production | Backup, restore va avariya tiklash sinovi | BAJARILDI | PostgreSQL + 3 persistent storage atomar backup/restore, SHA-256 manifest, nightly systemd timer, 24 soat RPO/4 soat RTO runbooki va real disposable restore drill mavjud |
| MON-06 | Production | Yuklama, xavfsizlik va penetration testi | BAJARILDI | Security header/CORS, ishonchli proxy IP, bounded auth rate-limit, audit redaction, 12 belgili parol siyosati, hashed reset-token va session revoke testlari o'tdi; resolved Maven OSV auditi 172/172 artifactda 0 topilma, npm auditda 0 critical; real HTTP baseline 3000/3000 kutilgan javob va 0 xato bilan o'tdi |
| MON-07 | Production | Qabul komissiyasi bilan yakuniy UAT | JARAYONDA | 8-33-bandlar uchun checklist, evidence manifest, qabul protokoli shabloni va fail-closed verifier mavjud; yakuniy qabul barcha blockerlar yopilib, komissiya imzolagandan keyin |

## Birinchi navbatdagi ishlar

Quyidagi ketma-ketlik keyingi implementatsiya uchun tavsiya etiladi:

1. ~~`STAB-01` - Flyway migratsiyalarini joriy qilish.~~ BAJARILDI
2. ~~`STAB-02` va `STAB-03` - yangi backend qoidalarini avtomatik test bilan yopish.~~ BAJARILDI
3. ~~`STAB-04` va `STAB-05` - frontend build hamda testlarni yashil holatga keltirish.~~ BAJARILDI.
4. ~~`STAB-07` - development va production environment shablonlarini to'ldirish.~~ BAJARILDI.
5. ~~`STAB-08` - haqiqiy SCORM 1.2 va 2004 paketlari bilan end-to-end sinov.~~ BAJARILDI.
6. ~~`EDU-01` - kurs, modul va oddiy kontent CRUDini real bazaga o'tkazish.~~ BAJARILDI.
7. ~~`EDU-02` - enrollment modeli va kontingent reestrini yaratish.~~ BAJARILDI.
8. ~~`EDU-03` - individual o'quv reja va fanlar kesimidagi progressni joriy qilish.~~ BAJARILDI.
9. ~~`EDU-04` - resursdan foydalanish hodisalari asosida davomatni hisoblash.~~ BAJARILDI.
10. ~~`EDU-05` - topshiriq, fayl topshirish, deadline va baholash oqimini yaratish.~~ BAJARILDI.
11. ~~`EDU-06` - test savollari banki, urinishlar va baholash qoidalarini yaratish.~~ BAJARILDI.
12. ~~`EDU-07` - sinxron va asinxron mashg'ulotlarni kurs hamda dars jadvaliga bog'lash.~~ BAJARILDI.
13. ~~`EDU-08` - semestr yakuniy nazorati service/controller oqimlarini tugatish va integratsion test bilan tasdiqlash.~~ BAJARILDI.
14. ~~`EDU-09` - davlat attestatsiyasi va bitiruv nazoratini kompilyatsiyadan tashqari workflow testlari bilan yakunlash.~~ BAJARILDI.
15. ~~`MON-01` - compliance panelini real dalillar bilan dinamik qilish.~~ BAJARILDI.
16. ~~`MON-02` - kamchilik, mas'ul, deadline va tuzatish rejasini kuzatish.~~ BAJARILDI.
17. ~~`MON-03` - anonim talaba va pedagog so'rovlari hamda agregat tahlil.~~ BAJARILDI.
18. ~~`MON-04` - kontingent, o'zlashtirish, kontent va faollik hisobotlari hamda eksport.~~ BAJARILDI.
19. ~~`MON-05` - backup, restore va avariya tiklash sinovi hamda RPO/RTO protokoli.~~ BAJARILDI.
20. ~~`MON-06` - yuklama, xavfsizlik va penetration testlarini bajarish hamda kritik topilmalarni yopish.~~ BAJARILDI.
21. `MON-07` - qaror bandlari bo'yicha yakuniy UAT checklist/protokolini tayyorlash va universitet qabul komissiyasi bilan imzolash. JARAYONDA: paket va verifier tayyor, imzo hamda qolgan bandlar pending.
22. ~~`PROC-01` - proktorli test urinishiga bog'langan server-side identity/active-movement preflightni joriy qilish.~~ BAJARILDI.
23. ~~`PROC-02` - faol urinish davomida kamera, tab/fokus, uzilish va qayta ulanish hodisalarini server jurnaliga yozish.~~ BAJARILDI.
24. ~~`PROC-03` - vakolatli proktor uchun real faol sessiyalar, risk hodisalari va attempt dalillari panelini yaratish.~~ BAJARILDI.
25. `PROC-04` - biometrik rozilik, saqlash muddati va o'chirish siyosatini joriy qilish. BLOKLANGAN: universitetning yuridik va axborot xavfsizligi tasdiqlagan siyosati kerak.
26. ~~`PROC-05` - proktoring hodisalari bo'yicha apellyatsiya va qo'lda qayta ko'rib chiqish oqimini yaratish.~~ BAJARILDI.
27. ~~`CONT-01` - kontent metadata, til, muallif, versiya va amal qilish davrini real modelga qo'shish.~~ BAJARILDI.
28. ~~`CONT-02` - kontent ekspertizasi va tasdiqlash workflowini joriy qilish.~~ BAJARILDI.
29. `CONT-03` - O'zDSt checklist va tasdiqlovchi hujjatlar reestri. BLOKLANGAN: `DEP-03` rasmiy checklisti kerak.
30. `CONT-04` - har fan bo'yicha yillik kontent to'liqligi hisobotini yaratish. NAVBATDA.

## Release darvozalari

Productionga chiqarishdan oldin quyidagilarning barchasi bajarilishi shart:

- [x] Backend build va barcha avtomatik testlar o'tgan (Docker talab qiladigan PostgreSQL smoke-test lokal muhitda skip).
- [x] Frontend build va barcha avtomatik testlar o'tgan.
- [ ] Flyway migratsiyasi bo'sh va mavjud baza nusxasida tekshirilgan.
- [x] SCORM 1.2 va SCORM 2004 end-to-end ssenariylari o'tgan.
- [x] Critical dependency yoki security zaifligi qolmagan (backend OSV 172 artifact: 0 topilma; frontend: 0 critical, RSC-only qoldiq risk quyida hujjatlashtirilgan).
- [ ] Production secretlar environment orqali berilgan.
- [x] Backupdan tiklash amalda tekshirilgan (PostgreSQL 18 lokal drill: 34 jadval, 3 storage, 3 xavfsizlik cheklovi, 11.25 soniya).
- [ ] Biometrik ma'lumotlar siyosati tasdiqlangan.
- [ ] 559-son qaror compliance panelida kritik buzilish qolmagan.
- [ ] Universitet mas'ullari UAT protokolini tasdiqlagan.

## Tashqi qarorlar va bog'liqliklar

| ID | Kerakli ma'lumot yoki qaror | Mas'ul tomon | Ta'sir qiladigan ishlar | Holat |
|---|---|---|---|---|
| DEP-01 | Vazirlik API spetsifikatsiyasi va test muhiti | Universitet/Vazirlik | INT-01 | KUTILMOQDA |
| DEP-02 | Ta'lim sifatini nazorat qilish API spetsifikatsiyasi | Universitet/Vakolatli organ | INT-02 | KUTILMOQDA |
| DEP-03 | O'zDSt 36.2030 rasmiy checklisti | Metodika/yuridik bo'lim | CONT-03 | KUTILMOQDA |
| DEP-04 | Biometrik rozilik va saqlash siyosati | Yuridik/axborot xavfsizligi | PROC-04, MON-07 | KUTILMOQDA |
| DEP-05 | Videokonferensiya provayderi | Universitet rahbariyati | COMM-04 | KUTILMOQDA |
| DEP-06 | Yakuniy UAT muhiti, qabul komissiyasi tarkibi va vakolatli imzolar | Universitet rahbariyati | MON-07 | KUTILMOQDA |

## Qarorlar jurnali

| Sana | Qaror | Sabab |
|---|---|---|
| 2026-08-03 | SCORM kontenti asosiy frontend originidan ajratiladi | Import qilingan paketning access/refresh tokenlarga kirishini cheklash |
| 2026-08-03 | Masofaviy yo'nalishda litsenziya rekviziti majburiy qilinadi | 17-band talabini qabul jarayonida nazorat qilish |
| 2026-08-03 | IT yo'nalishlariga 300/30 sonli limit qo'llanmaydi | Qarordagi istisnoni aks ettirish |
| 2026-08-03 | Xorijiy talabalar mahalliy qabul limitida hisoblanmaydi | 20-banddagi hisoblash qoidasini aks ettirish |
| 2026-08-04 | `face-api.js` ichidagi eski `node-fetch` 2.6.13 bilan override qilindi | Xavfsiz 2.x APIni saqlagan holda transitive high zaiflikni va majburiy major downgrade'ni bartaraf etish |
| 2026-08-04 | Vite 5 dan Vite 7.3.6 ga yangilandi | Windows dev-server path traversal/NTLM va esbuild advisorylarini yopish; build va 361 test bilan tekshirildi |
| 2026-08-04 | React Router RSC advisorysi vaqtincha qoldiq risk sifatida qabul qilindi | Loyiha faqat `BrowserRouter` SPA/CSR rejimida, RSC/SSR/Server Actions ishlatilmaydi; `react-router-dom` uchun mos tuzatilgan reliz chiqqanda darhol yangilanadi |
| 2026-08-04 | SCORM E2E sample paketlari loyiha ichida mustaqil yoziladi va test vaqtida PIF ZIPga yig'iladi | Test internetga va uchinchi tomon binar/litsenziyasiga bog'lanmaydi; manifest hamda runtime API kodi audit qilinadigan matn ko'rinishida saqlanadi |
| 2026-08-04 | Kurs lifecycle va enrollment alohida V2 migratsiyada saqlanadi | Mavjud V1 baseline o'zgartirilmaydi; ishlayotgan bazalar Flyway orqali takrorlanuvchi tarzda yangilanadi |
| 2026-08-04 | Modul va oddiy kontent V3 migratsiyada, SCORM paketlar esa mavjud maxsus jadvallarda saqlanadi | Oddiy URL/fayl metadata CRUDini SCORM runtime modelidan ajratish vakolat, publish va audit oqimlarini soddalashtiradi |
| 2026-08-04 | Individual reja enrollmentning o'quv yili, semestr, kredit va majburiy/tanlov metama'lumotlariga quriladi | Alohida statik reja nusxasi o'rniga talabaning haqiqiy kurs biriktirmalari reja bandi bo'ladi va dublikat ma'lumot kamayadi |
| 2026-08-04 | Fan progressi qo'lda kiritilmaydi; nashrdagi oddiy kontent bajarilishi va oxirgi tayyor SCORM paket natijasidan hisoblanadi | Audit qilinadigan o'quv hodisalarini yagona manba qilish va eski SCORM versiyalari yangisini bloklamasligini ta'minlash |
| 2026-08-04 | Davomat faqat o'qituvchi belgilagan vaqt oynasidagi enrolled talabaning oddiy kontent va SCORM o'quv hodisalaridan hisoblanadi; login hodisasi chiqarib tashlanadi | Qarorning resursdan haqiqiy foydalanishga asoslangan davomat talabini tekshiriladigan audit izi bilan bajarish |
| 2026-08-04 | Ochiq davomat sessiyasida hali faolligi yo'q talaba `pending`, sessiya yopilgandan keyingina `absent` bo'ladi | Davom etayotgan mashg'ulot paytida talabani muddatidan oldin yo'q deb belgilamaslik |
| 2026-08-04 | Topshiriqning topshirilgan vaqti klientdan olinmaydi; server vaqti bilan yoziladi va har qayta topshirish alohida attempt sifatida saqlanadi | Deadline hamda akademik natijaning o'zgartirib bo'lmaydigan audit izini ta'minlash |
| 2026-08-04 | Baholangan submission o'chirilmaydi yoki qayta topshirilmaydi; ball topshiriqning maksimal ballidan oshmaydi | Baho, feedback va topshirilgan dalil orasidagi bog'lanishni saqlash |
| 2026-08-04 | Assignment fayllari va SCORM kontenti public `/uploads/**` ildizidan tashqaridagi private katalogda saqlanadi | Statik URL orqali autentifikatsiya va IDOR tekshiruvini aylanib o'tishni bloklash; fayl faqat vakolatli download/content endpointidan beriladi |
| 2026-08-04 | Testning to'g'ri javoblari faqat teacher DTOlarida beriladi, student test sessiyasi va natija DTOlaridan chiqarib tashlanadi | Javob kalitining brauzer orqali sizib chiqishini oldini olish va baholash yaxlitligini saqlash |
| 2026-08-04 | Nashrdagi yoki yopilgan testda ishlatilgan savol tahrirlanmaydi va o'chirilmaydi | Oldingi urinishlarning savol, javob va ball auditini keyingi tahrirlardan himoyalash |
| 2026-08-04 | Test boshlanishi, tugashi, topshirish va baholash server vaqti hamda server qoidalari bilan boshqariladi; klient yuborgan vaqt ishonchli manba emas | Deadline, duration, urinish limiti va akademik natijani klient manipulyatsiyasidan himoyalash |
| 2026-08-04 | Har urinish uchun savollar tartibi bir marta saqlanadi va qayta ochilganda o'sha tartib tiklanadi | Shuffle ishlatilganda ham davom ettirilgan sessiya va audit natijasini barqaror saqlash |
| 2026-08-04 | `showResult=false` test natijasini test yopilguncha studentdan yashiradi | Javob va natijalar boshqa talabalarning hali davom etayotgan nazoratiga ta'sir qilmasligini ta'minlash |
| 2026-08-06 | EDU-07 migratsiyasi `V10` sifatida qo'shildi | Main branchda EDU-08 va EDU-09 uchun `V8` hamda `V9` versiyalari avvaldan band; Flyway tarixini qayta yozmasdan monoton yangilashni saqlash |
| 2026-08-06 | Mashg'ulot URLlari faqat to'liq HTTP/HTTPS bo'ladi va studentga enrollment hamda server access endpointi orqali beriladi | `javascript:` kabi xavfli sxemalarni, IDOR va auditni chetlab to'g'ridan-to'g'ri ochishni bloklash |
| 2026-08-06 | Jonli darsga kirish server vaqtida boshlanishdan 15 daqiqa oldin ochilib, tugashdan 30 daqiqa keyin yopiladi; recording/resurs boshlanishdan keyin ochiladi | Klient soatiga ishonmasdan amaliy ulanish oynasi va keyingi ko'rish imkoniyatini boshqarish |
| 2026-08-06 | Har live/recording/resource ochilishi `learning_session_accesses` va `learning_activity_events`da server vaqti bilan saqlanadi | Mashg'ulotdan haqiqiy foydalanish dalilini teacher statistikasi va faollikka asoslangan davomatga ulash |
| 2026-08-06 | Yakuniy nazorat ro'yxati sessiya e'lon qilinganda faol va yakunlagan course enrollmentlardan muzlatiladi | Keyingi enrollment o'zgarishlari e'lon qilingan imtihon tarkibi va audit dalilini yashirin o'zgartirmasligi uchun |
| 2026-08-06 | Auditoriya davomati faqat vakolatli xodim tomonidan `ONGOING` sessiyada tasdiqlanadi; tasdiqlovchi va vaqt serverda yoziladi | Talabaning o'zini o'zi qatnashgan deb belgilashi va klient vaqtini soxtalashtirishini bloklash |
| 2026-08-06 | Natija faqat `PRESENT` yoki `LATE` va tasdiqlangan talabaga kiritiladi; foiz, o'tganlik va A-F baho serverda hisoblanadi | Davomat dalili bilan akademik natijani bog'lash va klient yuborgan bahoga ishonmaslik |
| 2026-08-06 | Sessiya faqat barcha davomatlar yakuniy holatda va barcha qatnashganlar baholanganda yopiladi; student natijani faqat yopilgach ko'radi | Tugallanmagan qaydnoma hamda nazorat davomida natijaning sizib chiqishini oldini olish |
| 2026-08-06 | Talaba yakunlangan natijaga baholashdan keyin 10 kun ichida bitta ochiq apellyatsiya bera oladi | Apellyatsiya muddatini, egalikni va qayta ko'rish auditini izchil boshqarish |
| 2026-08-06 | Attestatsiya raisi sessiya yaratilganda avtomatik `CHAIR` bo'ladi, himoya ro'yxati publish paytida enrollmentlardan muzlatiladi | Komissiya tarkibi va bitiruvchilar ro'yxatini sessiya auditiga barqaror bog'lash |
| 2026-08-06 | Faqat komissiya a'zosi himoyani baholaydi; minimal a'zolar ovozi yig'ilganda o'rtacha ball va PASS/FAIL qarori serverda hisoblanadi | Bitta foydalanuvchi yoki klient yuborgan yakuniy qaror bilan davlat attestatsiyasi natijasini o'zgartirishni bloklash |
| 2026-08-06 | Sertifikatdagi `issuedBy` klient IDsi emas, autentifikatsiyadagi aktordan olinadi; raqam yil va tasodifiy noyob suffixdan tuziladi | Soxta emitent va bir xil `YYYY-00001` raqam kolliziyasini bartaraf etish |
| 2026-08-06 | DAK protokoli faqat to'liq yakunlangan sessiyadan yaratiladi va kurs egasidan alohida `ACADEMIC_WRITE` vakolatli administrator tasdiqlaydi | Davlat attestatsiyasi natijasida vakolatlar ajratilishi va rasmiy jurnalning o'zgarmasligini ta'minlash |
| 2026-08-06 | Sertifikat faqat tasdiqlangan DAK protokolidan keyin yaratiladi | Himoya natijasi, rasmiy protokol va bitiruv hujjati orasidagi tekshiriladigan zanjirni saqlash |
| 2026-08-06 | Compliance holati modul mavjudligi haqidagi statik bayroqdan emas, amaldagi repository yozuvlari va aniq dalil manbasidan hisoblanadi | Tashkilotning real tayyorgarligini kod imkoniyatidan ajratish; nol operatsion dalil `WARNING`, mavjud bo'lmagan proktoring va tashqi integratsiya esa `NON_COMPLIANT` bo'ladi |
| 2026-08-06 | Compliance tuzatish vazifasi `OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED` oqimida yuradi; `CLOSED` faqat buzilish real qayta hisobda yo'qolganda ruxsat etiladi | Qog'ozdagi “bajarildi” belgisi bilan mavjud nomuvofiqlikni yashirishni bloklash va yechim dalili, mas'ul hamda muddat auditini saqlash |
| 2026-08-06 | Compliance vazifalarini o'qish monitoring vakolatiga ochiq, yaratish/tahrirlash/status esa faqat `ACADEMIC_WRITE` vakolatiga beriladi | Kuzatuv shaffofligini saqlagan holda rasmiy tuzatish rejasini o'zgartirish vakolatini cheklash |
| 2026-08-06 | Survey response jadvali user FK, `created_by`, IP va user-agent saqlamaydi; takroriy javob survey-specific salt va alohida secret bilan HMAC qilinadi | Respondent shaxsini natija ma'lumotidan ajratish, bir kishining qayta javobini cheklash va oddiy hash lug'at hujumini qiyinlashtirish |
| 2026-08-06 | Anonim survey submit endpointining umumiy request auditi username/IP/user-agentni redakt qiladi | Javob vaqti orqali audit jurnalidan respondentni qayta bog'lash xavfini bartaraf etish |
| 2026-08-06 | Erkin matn survey savoli qo'llanmaydi; natija faqat so'rov yopilgach va kamida 5 respondent yig'ilganda agregat ko'rinadi | Matndagi o'zini fosh qiluvchi ma'lumot va kichik guruh taqsimotidan shaxsni bilvosita aniqlashni cheklash |
| 2026-08-06 | Hisobot scope'i klient parametridan olinmaydi: teacher faqat o'z kurslarini, `SUPER_ADMIN/ADMIN/METODIST/MONITORING` esa tashkilot kesimini ko'radi | Klient so'rovini o'zgartirib boshqa o'qituvchi yoki butun tashkilot ma'lumotiga kirishni bloklash |
| 2026-08-06 | CSV va XLSX fayllari brauzerda yig'ilmaydi, serverda bir xil real agregatdan yaratiladi va eksport auditi yoziladi | UI, API va yuklab olingan rasmiy hisobot orasidagi qiymat farqini oldini olish hamda eksportni kuzatish |
| 2026-08-06 | CSV matn kataklari `=`, `+`, `-` yoki `@` bilan boshlansa apostrof bilan zararsizlantiriladi | Kurs yoki mas'ul nomi orqali spreadsheet formula injection bajarilishini cheklash |
| 2026-08-06 | Hisobot oralig'i standart olti oy va ko'pi bilan besh yil; o'rtacha ball barcha davrdagi natijalardan, davomat barcha yopilgan sessiyalarning qatnashgan/jami nisbatidan hisoblanadi | Og'irliksiz kurs o'rtachalari va nomutanosib davomat hisobidan keladigan statistik og'ishni bartaraf etish |
| 2026-08-06 | Bitta backup PostgreSQL custom dump va `uploads`/SCORM/assignment storage arxivlarini SHA-256 manifest bilan birga atomar katalogda saqlaydi | DB va fayl dalillarini bitta restore nuqtasiga bog'lash, chala `.partial` backupni yaroqli deb qabul qilmaslik va buzilishni restore oldidan aniqlash |
| 2026-08-06 | Restore faqat yangi database va bo'sh storage rootga ruxsat etiladi; manba bazaning ustiga yozish, buzilgan checksum, storage ichidagi backup katalogi va symbolic link bloklanadi | Production ma'lumotini tasodifiy yo'qotish, rekursiv backup hamda archive/path hujumlarini cheklash |
| 2026-08-06 | Boshlang'ich SLO sifatida RPO 24 soat va RTO 4 soat qabul qilindi; nightly timer va har chorak disposable restore drill belgilandi | Backup mavjudligini emas, uning yangiligi va amalda tiklanish vaqtini o'lchanadigan operatsion nazoratga aylantirish; yakuniy SLO universitet egasi tomonidan tasdiqlanadi |
| 2026-08-06 | Klient IP faqat aniq ishonchli reverse-proxy manzilidan kelgan `X-Forwarded-For` bo'lsa olinadi; auth endpointlari bounded per-IP limiter bilan himoyalanadi | Spoofed header orqali audit/rate-limitni aylanib o'tish va cheksiz bucket bilan xotira sarflashni bloklash; multi-instance productionda gateway global limiti ham saqlanadi |
| 2026-08-06 | Parol kamida 12 belgi; reset-token bazada SHA-256 hash ko'rinishida; parol almashganda barcha refresh sessiyalar bekor qilinadi; kod ichidagi demo parollar olib tashlandi | DB/log sizishi oqibatini kamaytirish, o'g'irlangan refresh tokenni yaroqsiz qilish va standart credential bilan kirishni yo'qotish |
| 2026-08-06 | Backend dependency nazorati direct deklaratsiya emas, resolved `runtimeClasspath` va OSV bo'yicha bajariladi | Tranzitiv Commons Compress/Netty/Jackson zaifliklarini ham ko'rish; audit paytida Commons, POI, PostgreSQL JDBC, Jackson va Netty patched versiyalarga ko'tarildi |
| 2026-08-06 | MON-06 lokal HTTP baseline darvozasi 0 xato va `p95 <= 500 ms` qilib belgilandi | Health hamda security-filter zanjirida takrorlanadigan minimal performance regressiya chegarasini yaratish; bu to'liq capacity planning o'rnini bosmaydi |
| 2026-08-06 | MON-07 faqat 8-33-bandlarning har biri `AUTOMATED_PASS`, dalilli `MANUAL_PASS` yoki komissiya asoslagan `NOT_APPLICABLE` bo'lib, imzolangan protokol arxivlanganda yopiladi | Texnik testni tashkiliy/yuridik talab o'rnida ko'rsatmaslik, partial va tashqi blockerlarni yashirmaslik hamda soxta `signed=true` qiymatini dalilsiz qabul qilmaslik |
| 2026-08-06 | UAT manbasi 10 sahifali PDFning SHA-256 qiymati bilan muzlatildi | Checklist qaysi normativ nusxadan olinganini keyin tekshirish va manba almashtirilishini aniqlash |
| 2026-08-06 | Proktoring identifikatsiyasi brauzer descriptor/localStorage holatiga emas, server bergan 2 daqiqalik nonce va ikki xom kadr tahliliga tayanadi | Klient bypassini yopish, aynan bitta yuzni talab qilish, ro'yxatdagi server shabloni va so'ralgan yo'nalishdagi faol harakatni tekshirish |
| 2026-08-06 | Muvaffaqiyatli proktoring sessiyasi faqat bitta yangi quiz attemptga atomar bog'lanadi; mavjud faol attemptni davom ettirish qayta tasdiq talab qilmaydi | Tasdiq replayini bloklash, tranzaksiya xatosida attempt va consume holatini birga rollback qilish hamda qonuniy resume oqimini saqlash |
| 2026-08-06 | PROC-01 “sertifikatlangan anti-spoofing” yoki uzluksiz AI monitoring deb taqdim etilmaydi | Joriy mexanizm server-side identity + active movement preflight; kamera/fokus hodisalari PROC-02, proktor paneli PROC-03, biometrik siyosat va vendor/model bahosi PROC-04 gate'ida qoladi |
| 2026-08-06 | Proktoring eventining risk darajasi klient payloadidan olinmaydi; event turi bo'yicha serverda belgilanadi | Talaba brauzeri severityni pasaytirishi yoki o'zgartirishi mumkin bo'lgan ishonch chegarasini yopish |
| 2026-08-06 | Klient eventlari faqat `CONSUMED` proktoring sessiyasi va `IN_PROGRESS` attempt uchun, server start/end esa alohida `SERVER` source bilan yoziladi | Begona/yakunlangan attemptga yozishni bloklash va klient telemetriyasini authoritative lifecycle dalilidan ajratish |
| 2026-08-06 | Event retry UUID bo'yicha idempotent, batch 50 va attempt kvotasi 5 000 bilan chegaralangan | Offline/reconnect qayta yuborishlarini dublikat qilmaslik va event flooding orqali DB o'sishini cheklash |
| 2026-08-06 | Proktor global `PROCTOR` roli bilan barcha sessiyalarni emas, faqat quizga aniq biriktirilgan sessiyalarni ko'radi; kurs egasi va global akademik/admin vakolati alohida scope hisoblanadi | Minimal vakolat tamoyilini saqlash va boshqa kurs talabalarining biometrik/proktoring dalillariga IDOR orqali kirishni bloklash |
| 2026-08-06 | Proktoring hodisasi avtomatik aybdorlik qarori emas; panel uni tekshiriladigan risk dalili sifatida ko'rsatadi | Kamera, fokus va tarmoq hodisalarida tabiiy texnik sabablar bo'lishi mumkin; yakuniy qaror vakolatli qo'lda ko'rib chiqish va PROC-05 apellyatsiya oqimiga tegishli |
| 2026-08-06 | Asosiy frontend originida kamera faqat o'z originiga `Permissions-Policy: camera=(self)` bilan ruxsat etiladi | Real identity/liveness va davomiy kamera monitoringini ishlatish, shu bilan birga uchinchi tomon originlariga kamera vakolatini bermaslik |
| 2026-08-06 | Har proktorli attemptga ko'pi bilan bitta apellyatsiya va yakunlangan attemptdan keyin 10 kunlik murojaat oynasi beriladi | Bir xil dalil bo'yicha parallel/takroriy yakuniy qarorlarni cheklash va semestr imtihoni apellyatsiya muddati bilan izchil bo'lish |
| 2026-08-06 | Talaba appealda faqat o'z attemptining server belgilagan risk eventlarini tanlaydi; reviewer assignment scope'i PROC-03 bilan bir xil | Soxta/begona event ID bog'lashni va boshqa kurs daliliga IDOR kirishni bloklash |
| 2026-08-06 | Manual review `APPROVED/PARTIAL/REJECTED` yakuniy holati va asosini saqlaydi, ammo asl event, biometrik iz yoki quiz ballini o'zgartirmaydi va ikkinchi reviewga ruxsat bermaydi | Dalil yaxlitligi va qaror auditini saqlash; risk eventini avtomatik aybdorlik yoki akademik ball o'zgarishi bilan tenglashtirmaslik |
| 2026-08-06 | Kontentning har bir tahriri avval ishlatilmagan yangi `contentVersion` talab qiladi va oldingi holat o'zgarmas revision sifatida saqlanadi | Materialning qaysi muallif, manba va amal qilish davridagi versiyasi ishlatilganini keyin audit qilish; eski natijalarni ustidan yozib yubormaslik |
| 2026-08-06 | Legacy kontent V17da `legacy-{id}` versiyasi, aniq legacy manbasi va mavjud kurs tili yoki `und` bilan backfill qilinadi; keyingi tahrirda `und` qabul qilinmaydi | Eski yozuvlar kelib chiqishini uydirmasdan saqlash va ularni birinchi boshqaruv tahririda to'liq metadata bilan tuzatishga majburlash |
| 2026-08-06 | Talaba ro'yxati, to'g'ridan-to'g'ri progress yozuvi va fan progressi faqat `validFrom <= bugun <= validUntil` bo'lgan kontentni hisobga oladi | Kelajak uchun rejalashtirilgan yoki muddati tugagan materialdan foydalanish va u orqali progressni sun'iy oshirishni bloklash |
| 2026-08-06 | Ekspertiza qarori kontent IDga emas, aniq revision raqami va versiyasiga bog'lanadi; kontent egasi/yuboruvchisi o'z materialini tasdiqlay olmaydi | Keyingi tahrirni eski tasdiq bilan nashr qilishni va manfaatlar to'qnashuvidagi self-approvalni bloklash |
| 2026-08-06 | `CHANGES_REQUESTED` kamida 10 belgili asos talab qiladi; tahrir yangi revision yaratadi va qayta ekspertizadan o'tadi | Rad etish sababini audit qilinadigan qilish va bir xil rad etilgan snapshotni o'zgartirmasdan qayta yuborishni cheklash |
| 2026-08-06 | V18gacha ekspert qarori bo'lmagan nashrdagi legacy kontent migratsiyada qoralamaga qaytariladi | Tasdiqlovchi dalilsiz eski materialni avtomatik “tasdiqlangan” deb belgilamaslik va yangi publish gate'ini barcha kontentga bir xil qo'llash |

### Qoldiq dependency riski

| Paket | Audit holati | Loyiha uchun qo'llanishi | Qaror / qayta ko'rish sharti |
|---|---|---|---|
| `react-router-dom` / `react-router` 7.18.2 | 2 ta high yozuv, 0 critical; bitta [RSC Mode CSRF advisory](https://github.com/advisories/GHSA-qwww-vcr4-c8h2) zanjiri | Advisoryning o'zi faqat unstable RSC API ishlatilganda ta'sir qilishini bildiradi; hozirgi React 18 `BrowserRouter` SPAda RSC, SSR va Server Action endpointlari yo'q | Patched `react-router` 8.3.0 React >=19.2.7 va Node >=22.22 talab qiladi, `react-router-dom` 8.3.0 esa nashr etilmagan; productionda RSC yoqilmaydi, 7.x patch yoki mos major migratsiya chiqqanda yangilanib audit takrorlanadi |

## Ishlar jurnali

| Sana | Bajarilgan ish | Natija | Keyingi qadam |
|---|---|---|---|
| 2026-08-03 | Qaror PDFi tahlil qilindi va talablar ajratildi | 8-31-bandlar bo'yicha texnik matritsa tayyorlandi | Bazaviy moslashtirish |
| 2026-08-03 | Backend va frontend bazaviy moslashtirildi | SCORM, limitlar, compliance paneli va xavfsizlik tuzatishlari qo'shildi | STAB-01 |
| 2026-08-03 | Tekshiruvlar bajarildi | Backend compile muvaffaqiyatli; 559 qoidalari 3/3; frontendda avvalgi build/test qarzlari aniqlandi | STAB-02-STAB-05 |
| 2026-08-03 | Ushbu davomiy reja yaratildi | Barcha keyingi ishlar ID, band va qabul mezoni bilan qayd etildi | Rejani har o'zgarishda yangilash |
| 2026-08-03 | STAB-01 Flyway schema boshqaruvi joriy qilindi | V1 to'liq baseline, mavjud baza uchun xavfsiz 559 ustunlari, H2 schema-validatsiya testi va PostgreSQL 16 smoke-testi qo'shildi; lokal Docker yo'qligi sabab native test skip bo'ldi | STAB-02 |
| 2026-08-03 | STAB-02 SCORM service testlari yozildi | SCORM 1.2/2004 importi, paket ownership, Zip Slip, manifest, hajm limiti, runtime va IDOR ssenariylari 8/8 o'tdi | STAB-03 |
| 2026-08-03 | STAB-03 qabul qoidalari testlari yozildi | 300/30 limit, IT va xorijiy talaba istisnosi, kontrakt, til hamda 1:50 chegaralari 8/8 o'tdi | STAB-04 |
| 2026-08-04 | STAB-04 frontend build qarzlari yopildi | React Query v5, Zod/API DTOlari, talaba boshqaruvi va student UI tiplari moslashtirildi; `npm run build` muvaffaqiyatli o'tdi | STAB-05 |
| 2026-08-04 | STAB-05 frontend test qarzlari yopildi | Canvas test muhiti, ErrorBoundary recovery, Face ID setup va auth kutishlari tuzatildi; 23 fayl va 361/361 test o'tdi | STAB-06 |
| 2026-08-04 | STAB-06 dependency zaifliklari kamaytirildi | `npm audit`: 24 zaiflik (1 critical) dan 2 high/0 critical holatga; Vite 7.3.6, Axios va transitive paketlar yangilandi, build va 361 test qayta o'tdi | STAB-07 |
| 2026-08-04 | STAB-07 environment shablonlari to'ldirildi | Root va frontend `.env.example`, lokal/production ishga tushirish README'lari yaratildi; faol backend 17/17 va frontend 3/3 env qiymati qamrovi tekshirildi | STAB-08 |
| 2026-08-04 | STAB-08 SCORM end-to-end ssenariylari avtomatlashtirildi | SCORM 1.2 va 2004 sample SCOlar real ZIP/PIFga yig'ildi; import, launch/content, commit, finish, token rotatsiyasi va qayta ochish 2/2 o'tdi | EDU-01 va EDU-02 |
| 2026-08-04 | EDU-01 kurs lifecycle va EDU-02 enrollment oqimi joriy qilindi | V2 migratsiya, course CRUD/status API, owner/admin vakolati, kontingent UI, student kurs ro'yxati va enrollment asosidagi SCORM access qo'shildi | EDU-01 modul/kontent CRUD |
| 2026-08-04 | EDU-01 modul va oddiy kontent CRUD yakunlandi | V3 migratsiya, module/content CRUD va publish visibility, teacher real API UI hamda student visibility testi qo'shildi; backend 25 passed/1 skipped, frontend build va 361 test o'tdi | EDU-03 individual o'quv reja |
| 2026-08-04 | EDU-03 individual o'quv reja va fan progressi yakunlandi | V4 migratsiya, enrollmentga o'quv yili/semestr/kredit/reja turi, kontent progress auditi, SCORM+kontentdan avtomatik hisob, student reja/kurs materiallari UI va teacher biriktirish formasi qo'shildi; backend 27 passed/1 skipped, frontend build va 364/364 test o'tdi | EDU-04 faollik asosidagi davomat |
| 2026-08-04 | EDU-04 resursdan foydalanishga asoslangan davomat yakunlandi | V5 migratsiya, teacher-defined attendance session, kontent/SCORM activity auditi, present/late/absent/pending hisoblash, student ko'rsatkichlari va teacher boshqaruv UI qo'shildi; backend 30 passed/1 skipped, frontend build va 367/367 test o'tdi | EDU-05 topshiriq va baholash oqimi |
| 2026-08-04 | EDU-05 topshiriq, submission va baholash oqimi yakunlandi | V6 migratsiya, assignment CRUD/status, text/file attempt, deadline/late auditi, private download vakolati, maksimal ball va feedback, student/teacher real UI qo'shildi; backend 33 passed/1 skipped, frontend build va 371/371 test o'tdi | EDU-06 test banki va urinishlar |
| 2026-08-04 | EDU-06 test savollari banki, urinishlar va server-side baholash yakunlandi | V7 migratsiya, teacher savol/test CRUD va attempt auditi, student uchun sanitizatsiyalangan barqaror sessiya, server vaqti, urinish limiti, avtomatik ball/pass hisoblash hamda test faolligi davomat auditiga qo'shildi; backend 35 passed/1 skipped, frontend build va 376/376 test o'tdi | EDU-07 sinxron/asinxron mashg'ulotlar |
| 2026-08-05 | EDU-08 semestr yakuniy nazorati (imtihon sessiyalari) boshlandi | V8 migratsiya (exam_sessions, exam_attendance, exam_results, exam_appeals jadvalidari), 4 ta Kotlin entity model, 4 ta repository, 3 ta DTO fayl va ExamSessionService yaratildi; attendance va result servicelari ishlanmoqda | EDU-08 servicelari va controllerlari |
| 2026-08-05 | EDU-09 davlat attestatsiyasi (bitiruv imtihonlari) boshlandi | V9 migratsiya (7 ta jadval), 6 ta Kotlin entity model yaratildi; repository, DTO, service va controller ishlanmoqda | EDU-09 repository va servicelar |
| 2026-08-06 | EDU-07 sinxron/asinxron mashg'ulot va real dars jadvali yakunlandi | V10 migratsiya, teacher CRUD/lifecycle UI, student haftalik jadval, enrollment va server-time access, xavfsiz URL, live/recording/resource auditi hamda davomat hodisalari qo'shildi; backend 37 passed/1 skipped, frontend build va 381/381 test o'tdi | EDU-08 yakuniy nazorat workflowini test bilan tugatish |
| 2026-08-06 | EDU-08/09 ning oldindan commit qilingan kodlari mavjud loyiha APIlariga moslashtirildi | `CustomUserDetails`, audit, course view, enrollment query va nullable entity mapping nomuvofiqliklari tuzatildi; umumiy Kotlin compile va barcha regressiya testlari qayta yashil bo'ldi | EDU-08 uchun attendance/result/controller va workflow testlari |
| 2026-08-06 | EDU-08 semestr yakuniy nazorati to'liq yakunlandi | V8 modeliga teacher session lifecycle, publish-roster, server tasdiqlagan auditoriya davomati, davomatga bog'langan server-side baholash, completion gate, student visibility va 10 kunlik apellyatsiya qo'shildi; teacher/student real UI ishga tushdi; backend 39 passed/1 skipped, frontend 30 fayl 387/387 test va production build o'tdi | EDU-09 davlat attestatsiyasi workflow testlari |
| 2026-08-06 | EDU-09 backend workflow va vakolat qatlamining birinchi qismi yakunlandi | Komissiya raisi va publish-roster avtomatlashtirildi, `ONGOING` lifecycle, minimal komissiya ovozidan server-side o'rtacha/qaror, completion gate va sertifikat emitenti/raqami tuzatildi; himoya tarixi va sertifikat IDORlari hamda endpoint RBAC yopildi; attestatsiya workflow 1/1, umumiy backend 40 passed/1 skipped | EDU-09 protokol, frontend boshqaruv va student ko'rinishi |
| 2026-08-06 | EDU-09 davlat attestatsiyasi va bitiruv nazorat jurnali yakunlandi | Noyob DAK protokoli va mustaqil akademik tasdiq, protokoldan keyingi tekshiriladigan sertifikat, `/students/me` visibility, teacher/student real UI va IDOR testlari qo'shildi; backend 40 passed/1 skipped, frontend 31 fayl 391/391 test va production build o'tdi | MON-01 compliance panelini real modul dalillariga o'tkazish |
| 2026-08-06 | MON-01 dinamik compliance audit boshlandi | Hozirgi panelda qabul limiti va 1:50 real repositorylardan hisoblanishi, ammo 11 ta komponentning `IMPLEMENTED/PARTIAL` holati kodda statik yozilgani aniqlandi; real course/SCORM/activity/assignment/quiz/session/exam/attestation/certificate/audit dalillariga o'tkazish rejasi tuzildi | MON-01 evidence DTO va repository metrikalari |
| 2026-08-06 | MON-01 dinamik compliance paneli yakunlandi | 14 ta evidence manbasi, `measuredAt`, real record count, source/status va modul drill-down qo'shildi; mavjud bo'lmagan proktoring/integratsiya yashirilmaydi; backend 41 passed/1 skipped, frontend 32 fayl 392/392 test va production build o'tdi | MON-02 kamchiliklarni mas'ul va deadline bilan kuzatish |
| 2026-08-06 | MON-02 compliance kamchiliklarini tuzatish nazorati yakunlandi | V11 `compliance_issues`, mas'ul/deadline/reja, overdue, yechim dalili, auditli lifecycle va real buzilish yo'qolmasdan yopishni bloklash qo'shildi; monitoring read/academic write RBAC hamda admin UI ishlaydi; backend 44 passed/1 skipped, frontend 32 fayl 393/393 test va production build o'tdi | MON-03 anonim so'rovlar va agregat tahlil |
| 2026-08-06 | MON-03 anonim talaba va pedagog so'rovlari yakunlandi | V12 survey/question/identity-free response/answer modeli, student/teacher audience, HMAC duplicate nazorati, anonim request-audit, 5 respondent privacy threshold, admin lifecycle/agregat grafiklar va participant UI qo'shildi; `SURVEYS` 15-dalil sifatida compliance paneliga ulandi; backend 47 passed/1 skipped, frontend 33 fayl 395/395 test va production build o'tdi | MON-04 hisobotlar va CSV/XLSX eksport |
| 2026-08-06 | MON-04 real boshqaruv hisobotlari va eksport yakunlandi | Kontingent, faol talabalar, pedagog/kurs/enrollment, davrdagi yakunlash, barcha natijalardan o'rtacha ball, yopilgan sessiyalardan davomat, kontent, SCORM va faollik agregatlari qo'shildi; teacher/tashkilot scope'i serverda RBAC bilan ajratildi; auditli CSV/XLSX eksport, formula injection himoyasi va real frontend paneli ishlaydi; backend 51 passed/1 skipped, frontend 34 fayl 397/397 test va production build o'tdi | MON-05 backup/restore va RPO/RTO protokoli |
| 2026-08-06 | MON-05 backup, restore va avariya tiklash nazorati yakunlandi | PostgreSQL custom dump, uch storage arxivi/inventari, SHA-256 manifest, atomar publish, manbaga restore va buzilgan backup himoyasi, systemd nightly timer hamda RPO/RTO runbooki qo'shildi; lokal PostgreSQL 18 drillda 34/34 jadval fingerprinti, 3/3 storage va 3/3 safety check 11.25 soniyada `VERIFIED`, disposable baza/temp artefaktlar tozalandi; backend 51 passed/1 skipped | MON-06 yuklama va xavfsizlik sinovlari |
| 2026-08-06 | MON-06 yuklama va xavfsizlik nazorati yakunlandi | Exact CORS/security headerlar, trusted-proxy IP, bounded auth rate-limit, bir yozuvli redacted audit, 12-128 belgili parol siyosati, hashed reset-token/session revoke, random HEMIS paroli va hard-coded demo credentiallarni olib tashlash qo'shildi; resolved Maven OSV auditi 172 artifactda 0 topilma, frontend audit 0 critical/2 RSC-only high; health 2000/2000 (`p95 78.74 ms`, 938.71 RPS) va protected 401 1000/1000 (`p95 51.42 ms`, 934.04 RPS) 0 xato bilan o'tdi; backend 58 passed/1 skipped, frontend 34 fayl 395/395 test va production build o'tdi | MON-07 yakuniy UAT checklist va qabul protokoli |
| 2026-08-06 | MON-07 UAT paketining birinchi versiyasi tayyorlandi | Qarorning 10 sahifasi vizual qayta tekshirildi; 8-33-bandlar uchun 26 yozuvli manifest, manual checklist, imzo protokoli va fail-closed verifier qo'shildi. Baseline strukturaviy valid, ammo ataylab `ready=false`: 5 automated pass, 9 partial, 8 manual pending, 3 external blocker, 1 not implemented va imzosiz protokol; `-RequireReady` exit 3 bilan release'ni bloklaydi | PROC-01 real avtoproktoring va qolgan UAT blockerlarini ketma-ket yopish |
| 2026-08-06 | PROC-01 mavjud holati auditi boshlandi | Hozirgi `ProctoringSession` random demo buzilishlar yaratishi, `localStorage` flag/skip bilan face oqimi aylanib o'tilishi, frontend chaqirgan proctor API backendda yo'qligi va face verification exam/quiz attemptga bog'lanmagani aniqlandi | V13 server-bound proctoring session, identity check va audit modeli |
| 2026-08-06 | PROC-01 server-bound identity va active-movement preflight yakunlandi | V13 `proctoring_sessions`, SecureRandom nonce/SHA-256 hash, 2 daqiqalik LEFT/RIGHT challenge, server OpenCV orqali aynan bitta yuz va ro'yxatdagi shablon bilan ikki kadr mosligi, distinct-frame hash, movement threshold, pessimistic-lock bilan challenge/consume replay himoyasi, fail-closed quiz start va one-time attempt binding qo'shildi; frontenddagi hardcoded exam/random violation/soxta AI status olib tashlanib real kamera-challenge-start oqimiga almashtirildi; backend 62 passed/1 Docker skip (proktoring target 6/6), frontend 35 fayl 397/397 test va production build o'tdi | PROC-02 urinish davomida proktoring hodisalari jurnali |
| 2026-08-06 | PROC-02 proktoring hodisalari jurnali yakunlandi | V14 `proctoring_events`, server-derived severity/source, UUID dedup, vaqt/ownership/active-attempt tekshiruvi, 50-event batch va 5 000-event kvota qo'shildi; quiz start/end authoritative event yaratadi. Frontend test sessiyasi kamerani faol saqlaydi, track-ended, visibility, focus, network, 30 soniyalik heartbeat va page-exitni 5 000-event sessionStorage offline queue/keepalive bilan yuboradi, topshirishdan oldin flush qiladi; backend 62 passed/1 Docker skip, frontend 36 fayl 400/400 test va production build o'tdi | PROC-03 real proktor monitoring va dalillar paneli |
| 2026-08-06 | PROC-03 vakolatli proktor monitoringi va attempt dalillari yakunlandi | V15 `course_quiz_proctors`, teacher uchun proktor nomzodi/biriktirish API va UI, minimal-scope stats/sessiya/risk endpointlari, identity similarity, movement, SHA-256 kadr izlari va 200 eventli dalil timeline'i qo'shildi. Begona proktorning ro'yxat/dalil kirishi integratsion testda bloklandi, assignment o'zgarishi darhol scope'ni almashtiradi; `camera=(self)` policy real kamera oqimiga moslashtirildi; backend 63 passed/1 Docker skip, frontend 37 fayl 404/404 test va production build o'tdi | PROC-05 proktoring apellyatsiyasi va qo'lda qayta ko'rib chiqish; PROC-04 siyosat tasdig'ini kutadi |
| 2026-08-06 | PROC-05 proktoring apellyatsiyasi va manual review yakunlandi | V16 `proctoring_appeals`/event referenslari, 10 kunlik va bir attemptga bitta appeal gate'i, student ownership/event validation, biriktirilgan proktor/kurs egasi scope'i, o'zgarmas yakuniy review va audit qo'shildi. Talaba natija UIida event/izoh bilan murojaat qiladi, proktor dalilni ochib `APPROVED/PARTIAL/REJECTED` qaror beradi; begona student/proktor, faol attempt, soxta event, duplicate va ikkinchi review bloklanishi hamda score/event o'zgarmasligi testlandi; backend 63 passed/1 Docker skip, frontend 39 fayl 407/407 test va production build o'tdi | CONT-01 kontent metadata va versiyalash; PROC-04 siyosat tasdig'ini kutadi |
| 2026-08-06 | CONT-01 kontent provenance, versiyalash va amal qilish nazorati yakunlandi | V17 metadata/revision modeli, server validatsiyasi, noyob versiya va immutable tarix, teacher metadata/history UI hamda student provenance ko'rinishi qo'shildi; kelajakdagi/muddati tugagan kontent visibility va progressdan chiqarildi. Backend 64 passed/1 Docker skip, frontend 40 fayl 411/411 test va production build o'tdi | CONT-02 ekspertiza va tasdiqlash workflowi; CONT-03 rasmiy checklistni kutadi |
| 2026-08-06 | CONT-02 revisionga bog'langan mustaqil ekspertiza va publish gate yakunlandi | V18 `course_content_reviews`, pending queue, ownerdan ajratilgan metodist/admin qarori, majburiy rejection asosi, immutable history va legacy unpublish gate'i qo'shildi; teacher submit/status/history UI hamda metodist review paneli ishlaydi. Backend 67 passed/1 Docker skip, frontend 40 fayl 413/413 test va production build o'tdi | CONT-04 yillik kontent to'liqligi hisoboti; CONT-03 `DEP-03`ni kutadi |

## Yangilab borish qoidasi

Har bir keyingi implementatsiyada ushbu faylda quyidagilar yangilanadi:

1. Tegishli ishning `Holat` qiymati o'zgartiriladi.
2. Ish tugasa, qabul mezoni bo'yicha test yoki tekshiruv natijasi yoziladi.
3. `Ishlar jurnali`ga sana, natija va keyingi qadam qo'shiladi.
4. Yangi texnik yoki tashkiliy qaror bo'lsa, `Qarorlar jurnali`ga kiritiladi.
5. Tashqi bog'liqlik aniqlansa, unga `DEP-*` identifikatori beriladi.
6. Reja va kod holati bir-biridan farq qilmasligi uchun har yakuniy javobdan oldin hujjat tekshiriladi.
