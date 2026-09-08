# HEMIS ulanishini ishga tushirish

HEMIS guruh va talabalar importi, HEMIS orqali OAuth kirish va baholarni tashqariga yuborish alohida imkoniyatlar. Ushbu yo‘riqnoma guruh/talaba importiga tegishli.

## 1. API kirishini aniqlash

Foydalanuvchi tasdiqlagan manzil: https://student.namdtu.uz/. Integratsiya uchun tayyor token va `Authorization: Bearer <token>` ishlatiladi. Hujjat: https://student.namdtu.uz/rest/docs. 2026-09-08 kuni foydalanuvchi kirgan brauzer orqali HEMIS UNIVERSITY API 1.3 hujjati o‘qildi; `/rest/v1/data/group-list` va `/rest/v1/data/student-list` yo‘llari tasdiqlandi.

Muassasaning HEMIS administratoridan quyidagilarni oling:

- Muassasa uchun aniq API serveri va API asosiy yo‘li.
- Guruhlar va talabalarni o‘qishga ruxsatli API tokeni.
- Autentifikatsiya va guruh/talaba javob formatining hujjati yoki maxfiy ma’lumotsiz namunasi.

Adapter `HEMIS_API_TOKEN` qiymatini `GET /data/group-list` va `GET /data/student-list` so‘rovlariga Bearer token sifatida yuboradi. Login/parol so‘rovi yuborilmaydi. Yo‘llar `HEMIS_HOST` + `HEMIS_API_BASE_PATH` ostida. Token odatda faqat qiymat sifatida kiritiladi; `Bearer ` prefiksi bilan kiritilsa ham takrorlanmaydi. Guruh/talabalarni o‘qish ruxsatlari muassasa tokeniga bog‘liq.

## 2. Server sozlamalari

Quyidagilarni server jarayoni muhitiga kiriting; haqiqiy tokenni Git yoki chatga joylamang:

```dotenv
HEMIS_HOST=https://student.namdtu.uz
HEMIS_API_BASE_PATH=/rest/v1
HEMIS_REQUEST_TIMEOUT_SECONDS=15
HEMIS_API_TOKEN=
HEMIS_SYNC_ENABLED=false
```

Yuqoridagi host foydalanuvchi taqdim etgan manzil; `/rest/v1` esa mavjud adapterning boshlang‘ich qiymati. Swagger serveri `/rest/`, metodlari `/v1/...`; birgalikda API asosiy yo‘li `/rest/v1` bo‘ladi. Hujjatni ochish haqiqiy Backend API tokeni bilan ulanish sinovi o‘rnini bosmaydi. `.env.example` — namuna: Spring va `start-local.ps1` `.env` faylini avtomatik yuklamaydi. Muhit qiymatlarini backend jarayoniga uzating va backendni qayta ishga tushiring. Token frontendga berilmaydi. Eski `HEMIS_ADMIN_LOGIN` va `HEMIS_ADMIN_PASSWORD` sozlamalari endi ishlatilmaydi.

## 3. Ulanish va bitta guruh sinovi

1. Admin → Integratsiyalar (`/admin/integrations`)ni oching.
2. “Ulanishni tekshirish”ni bosing. Bu autentifikatsiya va bir dona guruh so‘rovini tekshiradi; LMS bazasiga talaba yoki guruh yozmaydi. Har bir HTTP so‘rovi sukut bo‘yicha 15 soniya bilan chegaralangan.
3. Muvaffaqiyatli tekshiruvdan keyin “Guruhlarni olish”ni bosing. “Guruhlarni moslashtirish”da HEMIS guruhini tegishli LMS guruhiga bog‘lang.
4. “Bitta guruhni import qilib tekshirish”dan bog‘langan guruhni tanlang. Import haqiqiy talabalarni yaratadi/yangilaydi. Tarixda yangi, yangilangan, ziddiyat va xatolar sonini tekshiring.
5. Talaba raqami, F.I.O., guruh va ta’lim ma’lumotlarini manba bilan solishtiring. Qayta importda takroriy akkauntlar yaratilmasligini tekshiring. Ziddiyatni yopishning o‘zi manba ma’lumotini o‘zgartirmaydi.
6. Sinov tasdiqlangach boshqa guruhlarni ulang; davriy yangilash kerak bo‘lsa `HEMIS_SYNC_ENABLED=true` qilib backendni qayta ishga tushiring. Standart jadval har 6 soatda.

## Diagnostika

`GET /api/v1/hemis/sync/connection` faqat mahalliy sozlamalarni tekshiradi (`INTEGRATION_READ`). `POST /api/v1/hemis/sync/connection/check` tashqi ulanishni tekshiradi (`INTEGRATION_WRITE`). Javobda maxfiy qiymatlar yoki HEMIS xato javobining asl matni qaytarilmaydi.

Holatlar: `NOT_CONFIGURED`, `NOT_CHECKED`, `CONNECTED`, `AUTH_FAILED`, `ACCESS_DENIED`, `API_NOT_FOUND`, `TIMEOUT`, `UNREACHABLE`, `REMOTE_ERROR`, `INVALID_RESPONSE`.

`CONNECTED` faqat guruhlar API’siga muvaffaqiyatli so‘rovni bildiradi. Talabalar importi va OAuth kirishni alohida tekshiring. Bo‘sh yoki `success=false` API javobi muvaffaqiyatli bo‘sh import deb hisoblanmaydi.


## Swagger bilan tekshirilgan shartnoma

- Import uchun **1. Backend API** va HEMIS boshqaruv panelidagi API User roliga tegishli Bearer token ishlatiladi. **3. Student API** kabinet tokeni boshqa turdagi ruxsatdir; u umumiy guruh/talaba importi tokeni o‘rnini bosmaydi.
- Backend API so‘rovlari LMS serveridan yuboriladi; brauzerga token berilmaydi.
- Sahifalash: `page=1,2,...`, `limit` maksimal 200. LMSdagi ichki checkpoint offseti adapterda sahifa raqamiga aylantiriladi. Guruhlar ham barcha sahifalardan olinadi.
- Jami yozuvlar `pagination.totalCount` orqali olinadi. Swagger misolidagi bir elementli `data`/`pagination` massivlari va obyekt ko‘rinishlari qabul qilinadi. Eski `data.total` ko‘rinishi ham saqlangan.
- Talabalar so‘rovida `_student_status=-1` barcha holatlarni oladi; bitirgan yoki chetlatilgan talabalar ham sinxronlashda ko‘rinadi.
- Fakultet `department`, til `group.educationLang`, o‘quv yili `educationYear`dan moslashtiriladi. `university` obyektining `name` qiymati olinadi.
- Hujjatda IP uchun maksimal 10 so‘rov/soniya ko‘rsatilgan. Adapter so‘rovlari kamida 125 ms oraliqda ketma-ket boshlanadi; shu IPdagi boshqa xizmatlar umumiy limitga ta’sir qilishi mumkin.

### Importdagi ochiq masala

`student-list` va `student-info` hujjat namunalarida JSHSHIR yo‘q. LMS yangi talaba uchun 14 raqamli JSHSHIR talab qiladi. Javobda `pinfl` yoki `passport_pin` bo‘lsa ishlatiladi; bo‘lmasa taxminiy qiymat yaratilmaydi va yozuv importida `HEMIS_PINFL_MISSING` qayd etiladi. Haqiqiy, ruxsatli javobda shu maydon mavjudligi yoki uni olishning tasdiqlangan yo‘li aniqlanishi kerak. Ushbu tekshiruvda haqiqiy talabalar olinmadi va import qilinmadi.

### Avtomatik tekshiruv

2026-09-08: `HemisConnectionTest` (9 ta) va `HemisBackendContractTest` (4 ta) muvaffaqiyatli o‘tdi. Testlar sun’iy HTTP javoblar bilan Bearer sarlavhasi, 201 guruhni ikki sahifada olish, checkpoint sahifasi, yangi talaba formati, yetishmagan JSHSHIR va takrorlangan sahifada xavfsiz to‘xtashni tekshiradi. Jonli API ulanishi yoki haqiqiy import sinovi bajarilmadi.
