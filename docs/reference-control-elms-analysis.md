# Control ELMS namuna tizimi bo'yicha UX va modul tahlili

Yangilangan sana: 2026-08-10  
Manba: `https://control-elms.namdtu.uz/`  
Tekshiruv usuli: administrator interfeysini faqat o'qish rejimida ko'rish. Login, parol va real foydalanuvchi ma'lumotlari ushbu hujjatda saqlanmaydi.

2026-08-10 qayta tekshiruvda `Talabalar`ning 5 ta va `Talabalar harakati`ning 3 ta menyu yo'nalishi yana tasdiqlandi. Detail route tashqi server timeouti va browser URL siyosati sabab qayta ochilmadi; shu bois maydon darajasidagi xulosalar V57da saqlangan sanitizatsiyalangan inventar bilan cheklangan.

## Maqsad

Namuna tizimidagi foydali boshqaruv naqshlarini ScormLmsga moslashtirish, ammo uning ma'lumot modeli yoki xavfsizlik kamchiliklarini ko'r-ko'rona takrorlamaslik.

## Ko'rilgan tuzilma

- `Talabalar`: guruhlar, faol talabalar, bitirganlar, o'qishni tiklaganlar va akademik ta'tildagilar.
- `Talabalar harakati`: ko'chirish, chetlashtirilgan talabalar va tiklangan talabalarning fanlari hisoboti.
- `Ta'lim jarayoni`: o'quv reja, rejaga biriktirilgan talabalar, o'quv dasturi, o'quv yili, semestr, fan guruhi, fan, baholash va vedmostlar.
- `Akkauntlar`: administratorlar va ruxsat guruhlari.
- `Asosiy ma'lumot`: davlat, hudud, tuman va millat klassifikatorlari.

## Olishga arziydigan g'oyalar

### 1. Talaba reyestrining tezkor boshqaruvi

- F.I.O., talaba raqami yoki pasport bo'yicha bitta qidiruv.
- Status bo'yicha filtr.
- Excel eksport.
- Jadvaldan profil, akkaunt va akademik amallarga tez o'tish.

ScormLmsda qidiruv natijasi minimal ma'lumot ko'rsatadi; JSHSHIR, pasport va login kabi identifikatorlar default jadvalda to'liq ochilmaydi.

### 2. Shaxsiy kartochka maydonlarini boyitish

Namuna formadagi foydali shaxsiy bloklar:

- ism, familiya va otasining ismi;
- telefon, tug'ilgan sana, foto;
- pasport raqami va JSHSHIR;
- millat, davlat va fuqarolik;
- hudud, tuman/shahar va ko'cha;
- ijtimoiy toifa va qo'shimcha izoh.

Bu maydonlar ScormLmsdagi V56 `REGISTERED` kartochkasiga tegishli. Guruh, o'quv reja, semestr va to'lov shakli esa shaxsiy kartochkaga qo'shilmaydi; ular alohida akademik qabul bosqichida qoladi.

### 3. Kaskadli akademik biriktirish

Tanlash ketma-ketligi:

`O'quv yili -> o'quv reja/dastur -> semestr -> guruh`

Keyingi selector oldingisi tanlanmaguncha yopiq turadi. ScormLms backendida har bir bog'lanish qayta tekshiriladi; frontend filtri xavfsizlik qoidasi o'rnini bosmaydi.

### 4. Ommaviy ko'chirish

Namuna tizimida talabalar checkbox bilan tanlanib yangi o'quv yili, reja, semestr va guruhga ommaviy ko'chiriladi. ScormLms uchun mos variant:

- faqat bir xil manba kontekstidagi talabalarni tanlash;
- yangi dastur/guruh mosligini serverda tekshirish;
- umumiy buyruq raqami, sana, huquqiy asos va sababni majburiy qilish;
- operatsiyani bitta tranzaksiyada bajarish;
- har talaba uchun immutable `TRANSFER` lifecycle hodisasi yaratish;
- natijani oldindan ko'rish va xatolarni ko'rsatish.

### 5. Alohida klassifikatorlar

Davlat, hudud, tuman, millat va ijtimoiy toifa erkin matn emas, boshqariladigan katalogdan tanlanadi. Bu yozuvlarni bir xil formatda saqlash va hisobotni ishonchli qilishga yordam beradi.

## Ko'chirilmaydigan jihatlar

- Shaxsiy ma'lumot, guruh va to'lovni bitta `Talaba kiritish` formasida aralashtirish.
- Talaba reyestrida pasport/login kabi identifikatorlarni hammaga ochiq ustunlarda ko'rsatish.
- Statusni oddiy switch bilan buyruqsiz o'zgartirish.
- Talabani izsiz o'chirish; ScormLms lifecycle va audit tarixini saqlaydi.
- Guruhni faqat nomdan iborat qilish; dastur, o'quv yili, ta'lim tili va faol holat bog'lanishi saqlanadi.
- Frontend selectorlariga ishonib, dastur-guruh yoki fakultet-dastur mosligini backendda tekshirmaslik.

## ScormLms uchun ustuvor backlog

| ID | Ish | Holat | Qabul mezoni |
|---|---|---|---|
| UX-STU-01 | V56 shaxsiy kartochka UIini pasport, telefon, fuqarolik va manzil bloklari bilan boyitish | BAJARILDI | V58 alohida full-replacement personal endpoint, to'rt blokli create/edit UI, normalizatsiya va server testlari bilan yakunlandi; akademik maydonlar personal formada yo'q |
| UX-STU-02 | Talaba reyestriga server-side qidiruv, status filtri va xavfsiz Excel eksport qo'shish | BAJARILDI | V60 server pagination/qidiruv/status filtri, `USER_READ + REPORT_READ` eksport, PII maskalash, 10 000 qator limiti, audit va vizual workbook QA bilan yakunlandi |
| UX-STU-03 | Akademik qabulni o'quv yili -> dastur -> semestr -> guruh kaskadiga o'tkazish | BAJARILDI | V59da UI ketma-ket tanlovga o'tdi; semestr saqlanadi, kurs avtomatik hisoblanadi, guruhning dastur/yil/til mosligi UI va serverda tekshiriladi |
| UX-STU-04 | Buyruqli ommaviy student transfer workflowini yaratish | BAJARILDI | V62 atomar batch, har talaba uchun immutable event, all-or-nothing preflight va natija bilan yakunlandi |
| UX-STU-05 | Fuqarolik mamlakati/hudud/tuman klassifikatorlarini normallashtirish | BAJARILDI | V63 FK katalog, faol/legacy snapshot, auditli admin CRUD va kaskad selectorlar bilan yakunlandi; etnik mansublik yig'ilmaydi |
| UX-STU-05-DATA | Rasmiy ISO/SOATO ma'lumotlarini versiyali to'ldirish | BAJARILDI | V64 249 mamlakat, 14 hudud va 206 tuman/shaharni manba versiyasi/SHA-256, idempotent import va local yozuvlarni saqlash bilan yakunladi |
| UX-STU-05-UAT | Legacy PostgreSQL migratsiya/importini dalillash | BAJARILDI | V65 V52→V53, student FK/local yozuv saqlanishi va ikkinchi 469/469 no-op importni disposable PostgreSQL 18da `VERIFIED` qildi |
| UX-STU-05-E2E | Klassifikator importi, RBAC va kaskad selectorlarni real HTTP/browser oqimida tekshirish | BAJARILDI | V66 disposable muhitda 401/200/403 RBAC, 429+40 birinchi import, 469 no-op takror import, admin paneldagi 249/14/206 sonlar va mamlakat→hudud→tuman selectorlarini tekshirdi; test talaba yozuvi yaratilmadi va muhit tozalandi |
| UX-STU-06 | Talaba profili, akademik biriktirish va akkaunt amallarini UIda alohida tab/menyularga ajratish | BAJARILDI | V61 uchta alohida RBAC va auditli ish maydoni bilan yakunlandi |
| UX-STU-07 | Tiklangan talabalar fanlari hisobotini yaratish | BAJARILDI | V67 so'nggi `REINSTATEMENT` buyrug'ini talabaning amaldagi course/fan biriktirishlari bilan birlashtiradigan read-only, qidiruvli va sahifalangan `USER_READ + ACADEMIC_READ + REPORT_READ` hisobotini backend va frontendda yakunladi |

## Ta'lim jarayoni bo'yicha gap-audit

Lokal kodda o'quv reja/curriculum versiyalash, fanlar, guruhlar, kurslar, individual reja, jadval, nazorat va baholar mavjud. Control ELMSdagi menyu bilan solishtirganda ularni qayta yaratish emas, bitta izchil administrativ oqimga yig'ish kerak.

| ID | Ish | Holat | Qabul mezoni |
|---|---|---|---|
| UX-EDU-01 | Ta'lim jarayoni navigatsiyasi va mavjud kontraktlarni gap-audit qilish | BAJARILDI | V68 mavjud curriculum, admission, course enrollment, fan, jadval, nazorat va baho modullarini xaritaladi; alohida curriculum assignment jadvali ma'lumotni takrorlashi aniqlandi |
| UX-EDU-02 | O'quv reja va unga talabalarni biriktirishni yagona workflow qilish | BAJARILDI | V68 `programId + academicYear` admission bog'lanishidan hosil qilinadigan read-only roster yaratdi; `REGISTERED` kartochkalar chiqarib tashlanadi, status/qidiruv/pagination serverda ishlaydi va yangi jadval/migratsiya kiritilmadi |
| UX-EDU-03A | O'quv yili va semestrni boshqariladigan katalogga ajratish | BAJARILDI | V69 V54 orqali tarixiy snapshotlarni o'zgartirmaydigan yil/semestr katalogi, `ACADEMIC_READ/WRITE` API, admin sahifa va admission/curriculum faol-katalog gate'larini qo'shdi |
| UX-EDU-03B | Fan guruhini curriculum va semestrga bog'langan katalog qilish | KEYINGI | Fan guruhi dastur, curriculum, o'quv yili, semestr va fan kesimida unique bo'ladi; mavjud course/group ma'lumotlari taxminiy bog'lanmaydi |
| UX-EDU-04 | Baholash va vedmostni mavjud exam/gradebook bilan birlashtirish | REJADA | Alohida parallel baho modeli yaratilmaydi; yopilgan nazorat, attendance va auditli natijadan rasmiy vedmost hosil qilinadi |

## Tavsiya etilgan ketma-ketlik

1. ~~`UX-STU-01` — shaxsiy kartochkani to'liq qilish.~~ BAJARILDI.
2. ~~`UX-STU-03` — akademik biriktirish selektorlarini to'g'ri bog'lash.~~ BAJARILDI.
3. ~~`UX-STU-02` — reyestr qidiruvi, filtr va eksport.~~ BAJARILDI.
4. ~~`UX-STU-06` — menyu va profil navigatsiyasini ajratish.~~ BAJARILDI.
5. ~~`UX-STU-04` — ommaviy transfer.~~ BAJARILDI.
6. ~~`UX-STU-05` — klassifikatorlarni bosqichma-bosqich normallashtirish.~~ BAJARILDI.
7. ~~`UX-STU-05-DATA` — rasmiy ISO/SOATO paketini versiyalash va import qilish.~~ BAJARILDI.
8. ~~`UX-STU-05-UAT` — V52 legacy PostgreSQL nusxasida V53 va ikki importni tekshirish.~~ BAJARILDI.
9. ~~`UX-STU-05-E2E` — real HTTP RBAC, admin import paneli va kaskad selectorlarni tekshirish.~~ BAJARILDI.
10. ~~`UX-STU-07` — tiklangan talabalar fanlari hisobotini qo'shish.~~ BAJARILDI.
11. ~~`UX-EDU-01` — Ta'lim jarayonidagi mavjud imkoniyatlarni bitta xaritaga solish va birinchi real gapni tanlash.~~ BAJARILDI.
12. ~~`UX-EDU-02` — o'quv rejaga biriktirilgan talabalarni admission ma'lumotidan hosil qilish.~~ BAJARILDI.
13. ~~`UX-EDU-03A` — o'quv yili va semestr kataloglarini normalizatsiya qilish.~~ BAJARILDI.
14. `UX-EDU-03B` — fan guruhini curriculum, davr va fanga bog'lash.
