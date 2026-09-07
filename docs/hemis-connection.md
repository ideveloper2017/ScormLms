# HEMIS ulanishini ishga tushirish

HEMIS guruh va talabalar importi, HEMIS orqali OAuth kirish va baholarni tashqariga yuborish alohida imkoniyatlar. Ushbu yo‘riqnoma guruh/talaba importiga tegishli.

## 1. API kirishini aniqlash

Foydalanuvchi tasdiqlagan manzil: https://student.namdtu.uz/. API kirish usuli va xizmat akkaunti hali tasdiqlanmagan.

Muassasaning HEMIS administratoridan quyidagilarni oling:

- Muassasa uchun aniq API serveri va API asosiy yo‘li.
- Guruhlar va talabalarni o‘qishga ruxsatli xizmat akkaunti yoki API tokeni.
- Autentifikatsiya va guruh/talaba javob formatining hujjati yoki maxfiy ma’lumotsiz namunasi.

Hozirgi adapter `POST /auth/login` orqali `data.token` olib, `GET /data/group-list` va `GET /data/student-list`ga Bearer token yuboradi. Yo‘llar `HEMIS_HOST` + `HEMIS_API_BASE_PATH` ostida. Faqat token berilsa yoki boshqa API shartnomasi ishlatilsa, adapterni avval shu shartnomaga moslashtirish kerak. Oddiy talaba akkauntining barcha talabalarni o‘qish huquqi bor deb hisoblamang.

## 2. Server sozlamalari

Quyidagilarni server jarayoni muhitiga kiriting; haqiqiy login/parolni Git yoki chatga joylamang:

```dotenv
HEMIS_HOST=https://student.namdtu.uz
HEMIS_API_BASE_PATH=/rest/v1
HEMIS_REQUEST_TIMEOUT_SECONDS=15
HEMIS_ADMIN_LOGIN=
HEMIS_ADMIN_PASSWORD=
HEMIS_SYNC_ENABLED=false
```

Yuqoridagi host foydalanuvchi taqdim etgan manzil; `/rest/v1` esa mavjud adapterning boshlang‘ich qiymati. Ikkalasi ham API ma’lumotlari bilan tasdiqlanishi kerak. `.env.example` — namuna: Spring va `start-local.ps1` `.env` faylini avtomatik yuklamaydi. Muhit qiymatlarini backend jarayoniga uzating va backendni qayta ishga tushiring. Kirish ma’lumotlari frontendga berilmaydi. Host kiritilmasa avvalgi muassasa manzili avtomatik tanlanmaydi.

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
