# MVP amaliy tekshiruvi — 2026-09-07

Tekshiruv lokal `http://localhost:5173` frontend va `http://localhost:8080` backendda demo talaba/o'qituvchi bilan bajarildi. SCORM ishlash mexanizmi o'zgartirilmadi.

## Topilgan va tuzatilgan muammolar

| Muammo | Sabab | Natija |
|---|---|---|
| O'qituvchi kirganda eski bosh sahifa chiqadi | `/` va umumiy dashboard eski `InstructorDashboard`ni ochardi | Kirish va menyu yangi `TeacherDashboard`ni, jumladan `Bugungi ishlar`ni ochadi |
| Dashboardda 2 kurs, ro'yxatda 0 kurs | Kotlin `grade: null`, `imageUrl: null` qaytarardi; frontend butun yozuvni rad etardi | Rasmsiz va bahosiz kurslar ham ko'rinadi |
| Topshiriq/test/davomat/baho yozuvlari yo'qolishi mumkin | Ixtiyoriy `null` maydonlar frontend sxemasiga mos emasdi | Faqat ixtiyoriy maydonlar normalizatsiya qilinadi; haqiqiy 0 saqlanadi, yo'q sana 1970-yilga aylanmaydi |
| Talabaning baholari doim bo'sh | Backend baholar va taqsimotda `emptyList`/nol qaytarardi | Baholangan topshiriqlar, yakunlangan test urinishlari va e'lon qilingan imtihon natijalari olinadi |
| GPA doim 0 | Hisoblash ulanmagan edi | Kreditlar bo'yicha testlar va oxirgi e'lon qilingan imtihondan hisoblanadi; baholash uchun kredit bo'lmasa UI `—` ko'rsatadi |
| Dars sahifasi uzun, qaysi dars bajarilgani noaniq | Barcha matnlar birdan ochilardi, barcha tugmalar `Bajarildi` edi | Dars tanlash, oldingi/keyingi dars, serverdan bajarilgan dars IDlari, aniq `Darsni yakunlash` amali |
| Dars yakunlangach dashboard eski progressni ko'rsatardi | Dashboard keshi yangilanmasdi | Kurslar, bosh sahifa va davom ettirish ma'lumoti yangilanadi |
| O'qituvchi kurs progressi 0 | Course DTO haqiqiy o'rtachani olmayotgan edi | Faol/yakunlangan biriktirishlardagi progress o'rtachasi olinadi |
| Demo progress restartdan keyin o'zgaradi | Seed kodi har ishga tushishda 35/60 qiymatlarini qayta yozardi | Mavjud biriktirishning progress va statusi saqlanadi; yangi biriktirish 0 dan boshlanadi |
| Startup ba'zan vaqtincha xato bilan to'xtaydi | HTTP port ochilishi backend to'liq tayyorligini anglatmasdi | Lokal skript vaqtincha `OUT_OF_SERVICE` holatida readinessni kutadi |
| Jurnal eksporti bosilganda hech narsa bo'lmaydi | Tugmaga amal ulanmagan | Tanlangan kurs va qidiruv bo'yicha CSV yuklanadi; sarlavha ham CSV deb nomlangan |

## Brauzerda tekshirilgan jarayonlar

- Talaba kurslar ro'yxatida ikkala demo kurs va to'g'ri progress ko'rindi.
- Darslar orasida o'tildi; faqat tanlangan dars matni ochildi.
- Demo dars yakunlandi: amaliy kurs progressi 33% → 67%; bosh sahifada ham 67% va aynan oxirgi dars ko'rindi.
- O'qituvchining `/` sahifasi yangi dashboard va `Bugungi ishlar`ni ko'rsatdi.
- O'qituvchi `[UX tekshiruv] Matnli topshiriq`ni demo amaliy kursda yaratdi.
- Talaba topshiriqni ko'rdi, matnli javob yubordi, `Topshirildi` holati chiqdi.
- O'qituvchi javobni ochib 85 ball va izoh saqladi; `Baholandi` holati chiqdi.
- Talabaning `Baholar` sahifasida shu topshiriq 85/100 va B+ bilan ko'rindi.
- Backend to'liq qayta ishga tushgach, o'qituvchi API javobida demo amaliy kurs progressi 67% saqlangani va health `UP` ekani tasdiqlandi.

Sinov topshirig'i faqat demo kursda qoldirildi: uni ikki rolda ham qayta ko'rib chiqish mumkin. Haqiqiy talabalar baholari o'zgartirilmadi.

## Hisoblash chegaralari

- Topshiriq ustunida har topshiriqning oxirgi baholangan urinishi ishlatiladi.
- GPA topshiriq ballarini avtomatik qo'shmaydi; testlar o'rtachasi va oxirgi e'lon qilingan imtihon natijasidan mavjud akademik qoida bo'yicha hisoblanadi.
- Hali yakunlanmagan imtihon natijasi talabaga ochilmaydi. Boshqa talabaning yoki bekor qilingan biriktirishning natijasi qaytmaydi.

## Avtomatik tekshiruv

- Frontend production build o'tdi.
- O'zgargan API sxemalari, dars navigatsiyasi va CSV bo'yicha 8 fayldagi 89 test o'tdi.
- Alohida PostgreSQL bazasida 20 backend testi o'tdi: `WorkspaceIntegrationTest` (6), `CourseLifecycleIntegrationTest` (12), `AcademicAnalyticsServiceTest` (2).
- Test bazasi tekshiruvdan keyin o'chirildi. Lokal ishlaydigan baza saqlandi.
- `git diff --check` o'tdi. O'zgarishlar commit qilinmagan.

## Davomi: transcript, hisobot va admin jarayoni

- `/student/transcript`: haqiqiy kurslar o'quv yili va semestrga guruhlanadi; kredit, ball, harfli baho va GPA ko'rsatiladi. Baholanmagan fan `F` hisoblanmaydi. Topshiriq baholari alohida baholar ro'yxatida, GPA esa mavjud test/yakuniy nazorat qoidasi asosida.
- `/student/reports`: sana va kurs filtri, davrdagi o'rtacha baho, baholar soni, oylik davomat va kurs bajarilishi. Ma'lumot yo'qligi `—`, haqiqiy nol esa `0` sifatida chiqadi. Sana chegaralari `Asia/Tashkent` bo'yicha, maksimal davr 731 kun.
- GPA, kredit va kurs bajarilishi tanlangan kurslarning joriy umumiy holati. Oylar jadvali va o'rtacha ball tanlangan davrga tegishli. Talabaning o'z hisoboti uchun guruh filtri qo'llanmaydi.
- Ikkala sahifadan PDF va haqiqiy XLSX yuklanadi. Hisobot eksporti aynan qo'llangan filtrlarni ishlatadi. PDF shaxsiy kabinet ko'chirmasi sifatida belgilanadi; registratorning rasmiy hujjat jarayoni alohida qoladi.
- So'nggi faoliyat darsning ochilishi/yakunlanishi, topshiriq yuborilishi va haqiqiy baholash vaqtini ko'rsatadi. So'rovlar talabaning o'z biriktirishlariga cheklangan.
- Admin reyestrida yaratishdan keyin yangi talaba qidiruvga qo'yiladi; biriktirish/parol tugmalari qatorning o'zida ko'rinadi. Server xatosi bo'sh ro'yxatdek yashirilmaydi.
- Admin kurslar havolasi eski katalogdan kurslarni amalda boshqarish sahifasiga o'tkazildi.
- Guruhga qabul, parol, LMS orientatsiyasi va kursga biriktirish alohida bosqichlar. Talaba guruhga qabul qilingani bilangina kursga avtomatik kirmaydi; qo'llanma bu farqni tushuntiradi.

### Davomiy tekshiruv

- Backend compile va frontend production build o'tdi.
- Frontend: transcript, filtr/eksport, xato/qayta urinish, baholar API, menyu va qabul kaskadi bo'yicha 30 turli test o'tdi. Bildirishnoma tizimi o'zgargach yangi sahifa testlari qayta o'tkazildi.
- Backend: kurs lifecycle (12), student lifecycle (6), account (5), registry (3) testlari o'tdi. Workspace (8) alohida qayta ishga tushirilib to'liq o'tdi; jami 34 turli test.
- Alohida PostgreSQL bazasi ishlatildi va tekshiruvdan so'ng o'chirildi. Birinchi urinishda demo seed uchun parol sozlamasi yetishmagan; test muhiti uchun demo seed o'chirilgach ishga tushdi. Bitta yangi testdagi profilsiz foydalanuvchi fixture to'g'ri talaba bilan almashtirildi.
- Ishlayotgan API: transcript va reports uchun PDF/XLSX — 4 eksport ham HTTP 200, to'g'ri MIME turi bilan. PDFlar PNGga chiqarilib tekshirildi; matn kesilishi yoki ustma-ust tushish yo'q.
- Brauzerda transkript 2 kurs/10 kreditni, hisobot demo topshiriqning 85/100 natijasini ko'rsatdi. Ushbu davomda haqiqiy talaba yaratilmadi yoki qabul qilinmadi; adminning yozish amallari disposable bazadagi integration testlarda bajarildi.

## Davomi: resurslar va talaba tanlash

- `/student/resources`: talabaning ochiq kurslaridagi matn, video, hujjat va havolalar bitta kutubxonada. Nom, kurs va tur bo'yicha filtrlash; resursdan aynan tegishli darsga o'tish; fayllarni autentifikatsiyalangan endpoint orqali yuklash.
- Xodimlarning `/resources` sahifasi o'z boshqaruv doirasidagi kurslardan material oladi. Ishlamaydigan `Yangi resurs` formasi o'rniga kursda material yaratish sahifasiga o'tish bor.
- O'chirilgan modul kontenti ro'yxatda ham, fayl yuklashda ham berilmaydi. Talabalar uchun qoralama, muddati tugagan va biriktirishi bekor qilingan materiallar yashiriladi.
- Kursning `Talabalar` bo'limida profil ID kiritish o'rniga ism, talaba raqami yoki guruh bo'yicha qidirish, guruh filtri, sahifalash va ko'p tanlash bor. Tanlangan ismlar filtr almashganda ham ko'rinadi va alohida bekor qilinadi.
- Nomzodlar kursning ta'lim dasturidagi faol talabalardan olinadi; allaqachon biriktirilganlar qayta ko'rsatilmaydi. Orientatsiya, fan guruhi yoki til mosligi muammosi sabab bilan chiqadi. Serverga bevosita so'rov yuborib ham nofaol talabani biriktirib bo'lmaydi.
- 11 frontend testi va 16 turli backend testi o'tdi (12 kurs lifecycle + 4 resurs/tanlagich). Bir yangi testdagi orientatsiya fixture masofaviy ta'lim shartiga moslashtirilib qayta tekshirildi. Frontend production build o'tdi. Testlar alohida PostgreSQL bazasida bajarildi; baza keyin o'chirildi.
- Brauzerda demo talaba 10 material ko'rdi; `Impuls` qidiruvi 1 materialni topdi va `content=7` darsini ochdi. O'qituvchi API 13 materialni hamda kurs bo'yicha nomzodlar/guruhlarni qaytardi. Brauzerda fan guruhiga biriktirilmagan nomzod sabab bilan o'chirilgan checkbox orqali ko'rindi; mavjud talaba ro'yxati saqlandi. Haqiqiy talabaning biriktirishi o'zgartirilmadi; to'liq tanlash → biriktirish → resursga kirish oqimi alohida test bazasida tekshirildi.

## Qolgan chegaralar

O‘quv jarayonining keyingi tekshiruvi va tuzatishlari: [2026-09-07 o‘quv jarayoni auditi](education-process-audit-2026-09-07.md). HEMIS foydalanuvchi topshirig‘i bilan keyinga qoldirildi.

### HEMIS ulanishiga tayyorgarlik — 2026-09-07

- Foydalanuvchi manzilni `https://student.namdtu.uz/` deb tuzatdi. API kirish usuli yoki xizmat akkaunti taqdim etilmadi.
- Ulanish diagnostikasi qo‘shildi: mahalliy sozlamalar alohida o‘qiladi; administrator bosgandagina login va bir dona guruh so‘rovi bajariladi. Tekshiruv hech qanday import yozuvi yaratmaydi. Xato javoblari maxfiy qiymatlarsiz, tushunarli holat bilan qaytadi.
- Muvaffaqiyatsiz/bo‘sh API javoblari endi muvaffaqiyatli bo‘sh ro‘yxat deb olinmaydi. HTTP so‘rovlari uchun vaqt chegarasi bor. Hostning avvalgi muassasaga avtomatik yo‘naltiruvchi qiymati olib tashlandi; API yo‘li muhit orqali sozlanadi.
- Panelda faqat bog‘langan faol guruhni tanlab import qilish bor. Kirish sozlamalari yetishmaganda guruh yuklash va import tugmalari o‘chiq.
- 8 diagnostika unit testi, 3 PostgreSQL integratsiya testi va 8 frontend testi o‘tdi. Frontend production build va yakuniy TypeScript tekshiruvi o‘tdi. Dastlab test kontekstida demo seed paroli yetishmagan; HEMIS testiga aloqasiz demo seed o‘chirilib testlar qayta o‘tkazildi. Alohida test bazasi keyin o‘chirildi.
- Sozlash va pilot import tartibi: [HEMIS ulanishi](hemis-connection.md).
- Lokal backend foydalanuvchi bergan host bilan qayta ishga tushirildi. Jonli diagnostika `NOT_CONFIGURED`, yetishmayotgan sozlamalar `HEMIS_ADMIN_LOGIN` va `HEMIS_ADMIN_PASSWORD`, davriy sinxronlash o‘chiq, tayyor guruhlar 0 ekanini qaytardi. Brauzerda shu manzil, sozlash xabari, o‘chiq import tugmalari va diagnostika tugmasi tekshirildi. Host ushbu backend jarayoniga muhit orqali berildi; doimiy server ishga tushirish muhitiga ham kiritilishi kerak. Haqiqiy HEMIS ma’lumotlari import qilinmadi.

HEMIS holati ishlayotgan serverdagi `/api/v1/hemis/sync/overview` orqali tekshirildi: `credentialsConfigured=false`, `periodicEnabled=false`, `mappingsTotal=0`, `mappingsReady=0`. Haqiqiy tashqi almashinuv bajarilmadi. Buning uchun serverda muassasaning HEMIS ulanish ma'lumotlarini sozlash va guruhlarni moslashtirish kerak.

LMSning barcha bo'limlari to'liq tayyor deb baholanmaydi; boshqa bo'limlar alohida audit talab qiladi. Kurs fanga/dasturga bog'lanmagan bo'lsa nomzod tanlagichi buning sababini ko'rsatadi. Guruhga qabul qilish va kursga biriktirish alohida amallar sifatida qoladi.

Keyingi qabul mezoni: har bir ustuvor sahifa uchun haqiqiy ma'lumotni ochish → amal bajarish → saqlash → qayta ochib natijani tasdiqlash.
