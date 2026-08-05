# 559-son qaror bo'yicha amalga oshirish rejasi

> Ushbu hujjat loyiha davomida yangilanadigan asosiy ish rejasidir. Har bir bajarilgan ishning holati, tekshiruv natijasi va muhim qarori shu faylga yozib boriladi.

## Hujjat ma'lumotlari

| Maydon | Qiymat |
|---|---|
| Manba | Vazirlar Mahkamasining 2022-yil 3-oktabrdagi 559-son qarori |
| Holat | Faol |
| Oxirgi yangilanish | 2026-08-04 |
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
| EDU-07 | 11 | Sinxron va asinxron mashg'ulotlarni kursga bog'lash | REJADA | Video, yozuv va havolalar dars jadvalida mavjud |
| EDU-08 | 21 | Semestr yakuniy nazoratini shaxsan qatnashish bilan qayd etish | JARAYONDA | V8 migratsiya, model va repository yaratildi; service va controller ishlanmoqda |
| EDU-09 | 21 | Davlat attestatsiyasi va bitiruv nazorat jurnali | JARAYONDA | V9 migratsiya, 6 ta entity model, 6 ta repository, 3 ta DTO, 4 ta service va 3 ta controller yaratildi; testlar ishlanmoqda |

### 3-bosqich. Avtoproktoring va biometrik boshqaruv - P0

| ID | Band | Ish | Holat | Qabul mezoni |
|---|---:|---|---|---|
| PROC-01 | 10-11 | Imtihon sessiyasi uchun yuz va liveness tekshiruvi | REJADA | Tekshiruv natijasi sessiya bilan bog'lanadi |
| PROC-02 | 10-11 | Kamera, tab almashtirish va uzilish hodisalari jurnali | REJADA | Har bir hodisa vaqt belgisi va risk darajasiga ega |
| PROC-03 | 10-11 | Proktor monitoring paneli va dalillar oynasi | REJADA | Proktor faqat vakolatli sessiyalarni ko'radi |
| PROC-04 | 10-11 | Biometrik rozilik, saqlash muddati va o'chirish siyosati | BLOKLANGAN | Universitetning tasdiqlangan maxfiylik siyosati talab qilinadi |
| PROC-05 | 10-11 | Apellyatsiya va qo'lda qayta ko'rib chiqish oqimi | REJADA | Talaba murojaati, dalil va yakuniy qaror saqlanadi |

### 4-bosqich. Elektron kontent sifati va O'zDSt 36.2030 - P1

| ID | Band | Ish | Holat | Qabul mezoni |
|---|---:|---|---|---|
| CONT-01 | 8-9 | Kontent metadata, til, muallif, versiya va amal qilish davri | REJADA | Har bir materialning kelib chiqishi va versiyasi aniqlanadi |
| CONT-02 | 8-9 | Ekspertiza va tasdiqlash workflow | REJADA | Kontent tasdiqlanmasdan publish qilinmaydi |
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
| MON-01 | 28-31 | Compliance holatini statik emas, real modul metrikalaridan hisoblash | REJADA | Har talab avtomatik dalil va yangilanish vaqtiga ega |
| MON-02 | 28-31 | Kamchilik, mas'ul, deadline va tuzatish rejasi | REJADA | Kamchilik yopilguncha kuzatiladi |
| MON-03 | 28-31 | Talaba va pedagog so'rovlari | REJADA | Natijalar anonim/agregat ko'rinishda tahlil qilinadi |
| MON-04 | 11, 28 | Kontingent, o'zlashtirish, kontent va faollik hisobotlari | REJADA | CSV/XLSX eksport va rolga asoslangan ko'rish mavjud |
| MON-05 | Production | Backup, restore va avariya tiklash sinovi | REJADA | Restore testi va RPO/RTO protokoli mavjud |
| MON-06 | Production | Yuklama, xavfsizlik va penetration testi | REJADA | Kritik topilma qolmagan |
| MON-07 | Production | Qabul komissiyasi bilan yakuniy UAT | REJADA | Qaror bandlari bo'yicha imzolangan qabul protokoli mavjud |

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
12. `EDU-07` - sinxron va asinxron mashg'ulotlarni kurs hamda dars jadvaliga bog'lash.
13. `MON-01` - compliance panelini real dalillar bilan dinamik qilish.

## Release darvozalari

Productionga chiqarishdan oldin quyidagilarning barchasi bajarilishi shart:

- [x] Backend build va barcha avtomatik testlar o'tgan (Docker talab qiladigan PostgreSQL smoke-test lokal muhitda skip).
- [x] Frontend build va barcha avtomatik testlar o'tgan.
- [ ] Flyway migratsiyasi bo'sh va mavjud baza nusxasida tekshirilgan.
- [x] SCORM 1.2 va SCORM 2004 end-to-end ssenariylari o'tgan.
- [ ] Critical dependency yoki security zaifligi qolmagan.
- [ ] Production secretlar environment orqali berilgan.
- [ ] Backupdan tiklash amalda tekshirilgan.
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

### Qoldiq dependency riski

| Paket | Audit holati | Loyiha uchun qo'llanishi | Qaror / qayta ko'rish sharti |
|---|---|---|---|
| `react-router-dom` / `react-router` 7.18.2 | 2 ta high yozuv, bitta RSC Mode CSRF advisory zanjiri | Hozirgi SPA `BrowserRouter` oqimida RSC, SSR va Server Action endpointlari yo'q | Productionda RSC yoqilmaydi; mos patched `react-router-dom` relizi paydo bo'lishi bilan yangilanadi va audit qayta ishlatiladi |

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

## Yangilab borish qoidasi

Har bir keyingi implementatsiyada ushbu faylda quyidagilar yangilanadi:

1. Tegishli ishning `Holat` qiymati o'zgartiriladi.
2. Ish tugasa, qabul mezoni bo'yicha test yoki tekshiruv natijasi yoziladi.
3. `Ishlar jurnali`ga sana, natija va keyingi qadam qo'shiladi.
4. Yangi texnik yoki tashkiliy qaror bo'lsa, `Qarorlar jurnali`ga kiritiladi.
5. Tashqi bog'liqlik aniqlansa, unga `DEP-*` identifikatori beriladi.
6. Reja va kod holati bir-biridan farq qilmasligi uchun har yakuniy javobdan oldin hujjat tekshiriladi.
