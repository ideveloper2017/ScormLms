# 559-son qaror bo'yicha yakuniy UAT checklist

Ushbu checklist 559-son qaror ilovasidagi 8-33-bandlarni qabul komissiyasi bilan tekshirish uchun ishlatiladi. Texnik test o'tgani tashkiliy yoki yuridik dalil o'rnini bosmaydi. Har bir ssenariy bo'yicha haqiqiy staging/productionga yaqin muhit, test foydalanuvchisi, dalil havolasi va issue raqami yoziladi.

## Sessiya ma'lumotlari

| Maydon | Qiymat |
|---|---|
| Tashkilot |  |
| Muhit va URL |  |
| Backend build/commit |  |
| Frontend build/commit |  |
| DB/Flyway versiyasi |  |
| Test sanasi va vaqt oralig'i |  |
| Komissiya raisi |  |
| Kotib |  |
| Texnik mas'ul |  |
| Metodik/yuridik mas'ul |  |

Natija qiymatlari: `PASS`, `FAIL`, `BLOCKED`, `NOT_APPLICABLE`. `NOT_APPLICABLE` faqat yozma asos va komissiya tasdig'i bilan qo'llanadi.

## Kirish darvozalari

- [ ] Release qilinadigan aynan shu build backend regressiyadan o'tgan.
- [ ] Frontend test va production build o'tgan.
- [ ] Flyway toza va mavjud baza nusxasida tekshirilgan.
- [ ] Critical security/dependency topilma yo'q; qoldiq risklar yozma qabul qilingan.
- [ ] Backupdan restore drill o'tgan va RPO/RTO tasdiqlangan.
- [ ] Real secret, HTTPS/CORS, storage va monitoring konfiguratsiyasi tekshirilgan.
- [ ] UAT dataset shaxsiy ma'lumot siyosatiga mos va qayta tiklanadigan.

## Funksional va normativ ssenariylar

| ID | Band | Ssenariy va bajariladigan amal | Kutilgan natija | Dalil | Natija / issue |
|---|---:|---|---|---|---|
| UAT-559-08 | 8 | LMS, Internet, server/storage, texnik shtat, rasmiy sahifa va bir yillik kontent hujjatlarini ko'rsatish; kontentning joriy/kelajak/muddati tugagan davrini sinash | Texnik-tashkiliy resurslar hujjat bilan tasdiqlanadi; faqat amaldagi kontent student va progressga kiradi | Server/ijara, shtat, URL, inventar, `CourseLifecycleIntegrationTest` |  |
| UAT-559-09 | 9 | Tanlangan resurs revisionini teacher sifatida ekspertizaga yuborish, o'zini tasdiqlashga urinish, metodist bilan qaytarish/tuzatish/tasdiqlash va publish qilish; so'ng O'zDSt checklist/sertifikatni tekshirish | Self-approval va tasdiqsiz publish bloklanadi; qaytarish asosli, yangi revision qayta tasdiqlanadi, tarix o'zgarmaydi va rasmiy hujjat bilan bog'lanadi | `CourseLifecycleIntegrationTest`, authorization/API testlari, checklist/protokol/sertifikat |  |
| UAT-559-10A | 10 | SCORM 1.2 va 2004 paketini import qilish, ishga tushirish, commit/finish va qayta ochish | Manifest xavfsiz tahlil qilinadi; score/progress/status/vaqt saqlanadi | E2E test va ekran yozuvi |  |
| UAT-559-10B | 10 | Proktorli imtihonda shaxsni/livenessni tekshirish, risk hodisasi yaratish va biriktirilgan/begona proktor bilan panelni ochish | Sessiyaga bog'langan server auditli natija va dalil faqat biriktirilgan proktor/kurs egasiga ko'rinadi; begona proktor bloklanadi | Identity/liveness, risk timeline, scope va assignment testi |  |
| UAT-559-10C | 10 | Yakunlangan proktorli attemptda risk eventini tanlab appeal yuborish va biriktirilgan/begona proktor bilan review qilish | 10 kunlik muddat, ownership va bitta appeal gate'i ishlaydi; vakolatli reviewer asoslangan yakuniy qaror beradi; event/ball o'zgarmaydi | Appeal lifecycle, IDOR va immutability testi |  |
| UAT-559-11A | 11 | Admin, teacher, student, proctor va monitoring rollari bilan ruxsatlarni tekshirish | Har rol faqat o'z vakolatidagi resurs va amallarni ko'radi | RBAC va audit log |  |
| UAT-559-11B | 11 | Kurs, kontent, davomat, topshiriq, test, live/async session va hisobot oqimini bajarish | Barcha o'quv hodisalari real API/DBda audit izi bilan saqlanadi | Workflow dalillari |  |
| UAT-559-11C | 11 | Kurs forumi, chat, guruh/shaxsiy xabar, e'lon/email/push va videokonferensiyani tekshirish | Vakolatli kommunikatsiya, yetkazilish/o'qilganlik va audit ishlaydi | Message/delivery log |  |
| UAT-559-12 | 12 | Talabani qabul qilish, statusini o'zgartirish, ko'chirish/qayta tiklash/chetlashtirish reglamentini tekshirish | Tashkilot tasdiqlagan jarayon va auditga mos | Buyruq/reglament/audit |  |
| UAT-559-13 | 13 | Kontraktsiz masofaviy talaba yaratish, so'ng haqiqiy kontrakt bilan qayta urinish | Birinchi urinish bloklanadi, ikkinchisi saqlanadi | API javobi va student kartasi |  |
| UAT-559-14 | 14 | Yo'nalishni amaldagi taqiqlangan ro'yxatga solishtirish | Ruxsat etilmagan yo'nalishda masofaviy qabul ochilmaydi | Vazirlik ro'yxati va tekshiruv |  |
| UAT-559-15 | 15 | Qabul parametri va kontrakt qiymatini tasdiqlovchi qarorga solishtirish | Tizimdagi qiymatlar vakolatli qaror bilan bir xil | Qaror/protokol va ekran |  |
| UAT-559-16 | 16 | Nodavlat tashkilot bo'lsa litsenziya va yo'nalish qamrovini tekshirish | Faqat amaldagi litsenziya doirasidagi dastur faol | Litsenziya nusxasi |  |
| UAT-559-17 | 17 | Masofaviy va kunduzgi dastur davomiyligini chegarada tekshirish | Masofaviy davomiylik kunduzgidan kam bo'lsa publish/qabul bloklanadi | Dastur kartasi va API xatosi |  |
| UAT-559-18 | 18 | Talaba tilidan boshqa tildagi dastur/kontent bilan qabul yoki publish qilish | Mos kelmagan til/dastur server tomonidan bloklanadi | API xatosi va test |  |
| UAT-559-19 | 19 | O'quv rejaning standart, malaka talabi va tasdiqlangan dastur versiyasini ochish | Curriculum manbasi va versiyasi tekshiriladi | Standart/reja/dastur hujjati |  |
| UAT-559-20 | 20 | Bakalavriat 300/301, magistratura 30/31, IT va xorijiy istisnolarni sinash | Chegaradan ortiq mahalliy non-IT qabul bloklanadi; istisnolar to'g'ri ishlaydi | Test/API/compliance |  |
| UAT-559-21 | 21 | Boshlang'ich shaxsan orientatsiya, semestr yakuniy nazorati va davlat attestatsiyasi ro'yxatini tekshirish | Orientatsiya tasdig'i, muzlatilgan roster, auditoriya davomati va DAK protokoli mavjud | Jurnal, exam va attestation dalili |  |
| UAT-559-22 | 22 | Ishlaydigan talabaning yakuniy nazorat ta'tili hujjatini tekshirish | Kamida 15 kalendar kunlik haq saqlanadigan ta'til dalili mavjud | Ariza/buyruq/ish beruvchi xati |  |
| UAT-559-23 | 23 | Talaba amaliyoti reja, ish joyi va kelishuviga mosligini tekshirish | Amaliyot muddati va joyi tasdiqlangan | Amaliyot reja/kelishuv |  |
| UAT-559-24 | 24 | Bitta fan bo'yicha dars, amaliyot, mustaqil ish, baholash va nazoratning to'liq zanjirini ko'rsatish | Barcha majburiy faoliyat LMSda va hisobotda mavjud | Kurs completeness hisoboti |  |
| UAT-559-25 | 25 | Xorijiy pedagog jalb qilingan bo'lsa uning vakolati va hujjatini tekshirish | Shartnoma/vakolat va kurs auditda bog'langan | Hamkorlik/mehnat hujjati |  |
| UAT-559-26 | 26 | O'qituvchiga 50- va 51-talabani biriktirish | 50 ruxsat, 51 blok; compliance metrikasi mos | API va compliance ekran |  |
| UAT-559-27 | 27 | O'quv reja va attestatsiyani tugatgan/tugatmagan talaba uchun bitiruv hujjatini chiqarish | Faqat barcha gate'lardan o'tgan talabaga tekshiriladigan hujjat beriladi | DAK, sertifikat/diplom reestri |  |
| UAT-559-28 | 28 | Monitoring roli bilan compliance, audit va hisobotlarni ochish | Vakolatli kuzatuvchi yozuvni o'zgartirmasdan dalillarni ko'radi | Monitoring ekran/audit |  |
| UAT-559-29 | 29 | Vazirlik va sifat nazorati integratsiyasida yuborish, retry, idempotency va xatoni ko'rsatish | Test muhiti yozuvni bir marta qabul qiladi, xato yo'qolmaydi | API log/outbox dalili |  |
| UAT-559-30 | 30 | Talaba/pedagog anonim so'rovini yopish va agregat natijani ko'rish | Shaxsiy identifikator saqlanmaydi; kichik guruh natijasi bostiriladi | Survey/audit/agregat |  |
| UAT-559-31 | 31 | Compliance buzilishini mas'ul/deadline bilan ochib, soxta va real yopishni sinash | Real dalil tuzatilmaguncha yopish bloklanadi; overdue ko'rinadi | Issue lifecycle/audit |  |
| UAT-559-32 | 32 | Imtihon apellyatsiyasi va umumiy o'quv-metodik murojaatni yuborish | Murojaat egasi, deadline, ko'rib chiqish va qaror audit qilinadi | Appeal/ticket dalili |  |
| UAT-559-33 | 33 | Aniqlangan buzilish uchun mas'ul va eskalatsiya reglamentini tekshirish | Audit yozuvi ichki/yuridik jarayonga izchil bog'lanadi | Reglament va incident raqami |  |

## Yakuniy qabul mezoni

- Barcha bandlar `PASS` yoki komissiya asoslagan `NOT_APPLICABLE` bo'lishi shart.
- `FAIL`, `BLOCKED`, critical security topilma yoki imzosiz qoldiq risk bilan yakuniy qabul berilmaydi.
- Har `PASS` uchun qayta ochiladigan dalil mavjud bo'ladi; faqat skrinshot keng funksional talabni isbotlamaydi.
- Natijalar `decision-559-uat-evidence.json` manifestiga ko'chiriladi va verifier bilan tekshiriladi.
- Qabul qarori [qabul protokoli](decision-559-acceptance-protocol.md)da barcha vakolatli tomonlar tomonidan imzolanadi.
