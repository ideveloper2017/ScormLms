# O‘quv jarayoni E2E sinovi — 2026-09-08

Sinov alohida PostgreSQL bazalarida bajarildi: `scorm_lms_e2e_20260908` va `scorm_lms_e2e_regression_20260908`. Backend 8092, frontend 5192 portida ishladi. Oddiy loyiha bazasiga sinov yozuvlari kiritilmadi.

Mahalliy log va JSON natija `tmp/e2e-20260908/` ichida saqlandi; ular Gitga kiritilmaydi. Talaba ekranini namoyish qilish uchun alohida sinov muhiti vaqtincha saqlab turildi.

## Natija

- HTTP orqali 22 ta tekshiruv muvaffaqiyatli o‘tdi. Qayta bajarish skripti: `scripts/education_e2e.py`.
- `AssignmentWorkflowIntegrationTest`: 4 test, `QuizWorkflowIntegrationTest`: 4 test; xatolar yo‘q.
- Brauzerda o‘qituvchi va talaba hisoblariga kirish, darsni ochish, talaba javobini yuborish, o‘qituvchi tomonidan 92 ball va izoh berish, talaba ekranida aynan shu baho va izohni ko‘rish bajarildi.

## HTTP ssenariysi

O‘qituvchi kurs yaratdi va e’lon qildi; talaba biriktirildi. Modul va matnli dars yaratildi. Tasdiqlanmagan darsni e’lon qilish rad etildi; administrator ko‘rib chiqqach dars e’lon qilindi. Talaba darsni 100% yakunladi va asinxron mashg‘ulotga kirish hodisasini yubordi.

Talaba ochiq topshiriqni topshirdi, o‘qituvchi 85/100 ball va izoh berdi. Talabaning o‘ziga baho qo‘yishi hamda kurs yaratishi 403 bilan rad etildi. Test javobi serverda 100% baholandi.

Davomat yoki baho yetishmagan imtihonni yopish rad etildi. Davomat va 80/100 ball kiritilgach administrator vedomostni yakunladi. Yopilmagan imtihon talaba natijalarida ko‘rinmadi; yopilgach ko‘rindi. Yopilgan imtihonda oddiy baho tahriri rad etildi.

Transkript va akademik reyestr yakuniy 90 ballni ko‘rsatdi: (100 test + 80 imtihon) / 2. Topshiriq bahosi ushbu hisobga kirmaydi. O‘qituvchi baholash jurnalida ham 85 topshiriq, 100 test, 90 yakuniy va A baho ko‘rildi. Talaba transkriptida sinov kursi 6 kredit, 90 ball, A baho bilan ko‘rildi.

## Topilgan va tuzatilgan xatolar

1. Bo‘sh bazada standart administratorning qisqa paroli amaldagi parol talabidan o‘tmay, ilova ishga tushishini to‘xtatardi. `APP_SEED_ADMIN_PASSWORD` berilmasa administrator yaratish o‘tkazib yuboriladi. Mavjud hisoblar o‘zgarmaydi.
2. Darslar 100% tugaganda biriktirish `COMPLETED` bo‘lib, hali ochiq topshiriq topshirish va test ishlash bloklanardi. Bu holat uchun topshirish, test boshlash, javob saqlash va yakunlashga ruxsat berildi. Kursdan chiqarilgan talaba uchun cheklov saqlanadi; yangi regressiya testi ikkala holatni tekshiradi.

## Brauzer sinovi tafsiloti va chegaralar

Asosiy HTTP kursi: `E2E Fizika 20260908-021450` (sinov bazasida ID 7). Qo‘shimcha `E2E brauzer: kuch va birlik` topshirig‘i API orqali tayyorlandi. Talaba brauzerda `F = m × a = 2 × 3 = 6 N` va birlik izohini yubordi. O‘qituvchi brauzerda 92 ball hamda izoh saqladi; qayta kirgan talabada 92/100 va aynan shu izoh ko‘rindi.

Brauzerdagi topshiriq yaratish formasining sana maydoni avtomatlashtirish orqali to‘ldirilmadi; maydon bo‘sh qolganini DOM tekshiruvi tasdiqladi. Shu sababli brauzer orqali topshiriq yaratish yakunlandi deb hisoblanmaydi. Bu holat ilova xatosi ekanligi hali tasdiqlanmagan.

Qo‘shimcha UX kuzatuvlari: o‘qituvchi dashboardida yakunlangan kurs uchun “0 talaba” yozuvi chiqadi, garchi baholash jurnalida talaba mavjud bo‘lsa ham; faol talabalar soni ekanini aniqlashtiruvchi yorliq kerak. Faqat matnli topshiriq oynasida ham fayl yuklash va “fayl yoki matn” ko‘rsatmasi ko‘rinadi; ko‘rsatmani topshiriq turiga moslash kerak. Bu ikki UX holati ushbu o‘zgarishda tuzatilmadi.

HEMIS, SCORM, tashqi videokonferensiya, fayl yuklash hamda PDF/Excel eksport bu ssenariyda sinalmadi. Bu hisobot butun mahsulot xatosiz ekanini bildirmaydi.
