# 559-son qarorga moslashtirish matritsasi

Manba: O‘zbekiston Respublikasi Vazirlar Mahkamasining 2022-yil 3-oktabrdagi 559-son qarori, masofaviy ta’limni tashkil etish tartibi.

## Ushbu o‘zgarishda bajarildi

| Band | Talab | Amalga oshirilgan yechim |
|---|---|---|
| 10 | LMS SCORM standartiga mos bo‘lishi | SCORM 1.2 va SCORM 2004 ZIP importi, xavfsiz manifest tahlili, runtime API, natija/progress/vaqtni saqlash |
| 10–11 | Identifikatsiya va avtoproktoring | Biometrik ma’lumotga IDOR himoyasi, mavjud proktoring moduli holati compliance panelda ko‘rsatiladi |
| 11 | Foydalanuvchi reestri, autentifikatsiya, harakatlar | Refresh token rotatsiyasi tuzatildi, WebSocket autentifikatsiyasiz ishlamaydi, audit mexanizmi saqlandi |
| 20 | Bakalavriat 300, magistratura 30; IT istisnosi; xorijiy talabalar hisobga kirmaydi | Yo‘nalish sozlamalari va talaba yaratish/yangilash paytida avtomatik validatsiya |
| 17, 20 | Litsenziya va qabul parametrlarini e’lon qilish | Masofaviy yo‘nalishda litsenziya rekviziti majburiy; admin formasiga til, limit va IT belgisi qo‘shildi |
| 26 | O‘qituvchi-talaba nisbati 1:50 dan oshmasligi | Qabul paytida bloklovchi qoida va compliance metrikasi |
| 28–31 | Monitoring va kamchiliklarni aniqlash | `/api/v1/compliance/559/summary` va admin menyusidagi “559-son qaror” nazorat paneli |

## Keyingi integratsiya bosqichlari

- Vazirlik va ta’lim sifatini nazorat qilish axborot tizimlari uchun rasmiy API spetsifikatsiyasi olinib, 29-band integratsiyasi bajarilishi kerak.
- O‘zDSt 36.2030 bo‘yicha elektron kontent sertifikatsiyasi tashqi tashkiliy jarayon; tizimga sertifikat/ekspertiza hujjatlari reestrini qo‘shish kerak.
- Har semestr yakuniy nazorat va davlat attestatsiyasida shaxsan ishtirok etganlikni qayd qilish uchun imtihon joyi hamda tasdiqlovchi jurnal kerak.
- Avtoproktoringni productionga chiqarishdan oldin biometrik rozilik, saqlash muddati va apellyatsiya jarayoni tasdiqlanishi kerak.

## Production sozlamalari

- `SPRING_PROFILES_ACTIVE=postgresql-prod`, `JWT_SECRET`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` majburiy beriladi.
- `CORS_ALLOWED_ORIGINS` faqat ishonchli frontend originlarini o‘z ichiga oladi.
- `SCORM_STORAGE_DIR` doimiy diskka, `SCORM_SECURE_COOKIE=true` HTTPS muhitiga sozlanadi.
- Frontendda `VITE_SCORM_CONTENT_ORIGIN` API originiga qo‘yiladi. SCORM paketlari asosiy frontend originidan ajratilib, runtime qiymatlari `postMessage` ko‘prigi orqali uzatiladi.
