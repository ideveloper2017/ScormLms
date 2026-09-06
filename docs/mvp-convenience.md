# SCORMdan tashqari MVP qulayliklari

## Foydalanish

- Yuqoridagi qidiruv tugmasi yoki `Ctrl/Cmd + K` orqali sahifa, kurs va talabani topish mumkin. Qidiruv kamida 2 ta belgi bilan ishlaydi. Natijalar serverda vakolat bilan cheklanadi; o'qituvchi o'z kurslaridagi talabalarni ko'radi.
- Talaba kabinetidagi `Darsni davom ettirish` oxirgi tanlangan oddiy materialga qaytaradi. Darsdagi `Shu darsni o'qish`, faylni yuklash yoki tashqi materialni ochish oxirgi darsni saqlaydi. Oldingi bajarilish foizi pasaymaydi.
- Talaba va o'qituvchi bosh sahifasidagi `Bugungi ishlar` yaqin 7 kunlik darslar, testlar, topshiriqlar va tekshirilmagan ishlarni ko'rsatadi. Topshiriq/test tugmasi tegishli yozuvni ajratib ochadi; `Barchasini ko'rsatish` filtrni tozalaydi.
- Nashr qilingan topshiriqqa 24 soatdan kam vaqt qolganda, hali topshirmagan faol talabaga ichki bildirishnoma beriladi. Worker har 5 daqiqada ishlaydi. Bir foydalanuvchi/topshiriq/muddat uchun bitta eslatma yuboriladi; bildirishnoma o'chirilsa ham qayta yuborilmaydi. Muddat o'zgarsa yangi eslatma berilishi mumkin. Yopilgan yoki o'chirilgan kurs/topshiriq eslatma yaratmaydi.
- Test javoblari yozish to'xtaganidan 500 ms o'tgach serverga ketma-ket saqlanadi. Sahifa yangilanganda faol urinishning saqlangan javoblari qaytadi. Aloqa uzilsa javoblar ochiq sahifada qoladi, holat ko'rsatiladi va qayta ulanishda yoki har 10 soniyada qayta uriniladi. Hali serverga yetmagan javoblar borida brauzerni yopish ogohlantiradi.
- Kurs yaratishda narx, chegirma, muddat va media sozlamalari `Qo'shimcha sozlamalar` ichida. Kurs saqlangach materiallar qo'shiladi.
- `Mening kurslarim → Nusxa olish` kurs, bo'limlar va oddiy materiallarni yangi qoralamaga ko'chiradi. Yuklangan material fayllari mustaqil nusxalanadi. Nashr/tasdiqlash holatlari qayta boshlanadi; talabalar, natijalar, topshiriqlar, testlar va SCORM paketlari ko'chirilmaydi.
- Admin/metodist kabinetida dastlabki sozlash uchun 5 qadamli holat va tegishli sahifaga o'tish mavjud. Bu minimal boshlang'ich tayyorlik ko'rsatkichi.
- O'qituvchining topshiriq baholash oynasida talaba javobi, PDF/rasm ko'rinishi, fayl yuklash, ball va izoh bir joyda. `Saqlash va keyingisi` navbatdagi tekshirilmagan ishni ochadi.

## Baholar semantikasi

O'qituvchi jurnalidagi topshiriq ustuni har topshiriqning oxirgi baholangan topshirishidan hisoblanadi. Test ustuni yakunlangan test urinishlari o'rtachasi. Joriy natija akademik reyestrning mavjud qoidasi bilan bir xil: testlar o'rtachasi va oxirgi imtihon natijasi mavjud bo'lsa ularning o'rtachasi, bittasi bo'lsa shu qiymat. Topshiriq va davomat bu hisobga avtomatik qo'shilmaydi. Baholanmagan qiymat `null` / `—`, haqiqiy nol esa `0` bilan ko'rsatiladi. Kursni o'qib tugatish foizi baho sifatida ishlatilmaydi.

## Ishga chiqarish

Backend va frontend birgalikda yangilanadi. Flyway `V72__deadline_reminder_deliveries.sql` migratsiyasini qo'llaydi. Tashqi bildirishnoma provayderi talab qilinmaydi. Eslatmalar mavjud ichki bildirishnoma xizmatidan foydalanadi.

## Qabul tekshiruvlari

1. Testda javob tanlash → `Javoblar saqlandi` → sahifani yangilash → o'sha javob tiklanishi.
2. O'qituvchi boshqa o'qituvchi kursini/talabasini qidirganda begona natija chiqmasligi.
3. Talaba oddiy darsni tanlashi → bosh sahifa → davom ettirish aynan shu materialni ajratishi; qoralamaga qaytarilgan dars davom ettirishda ko'rinmasligi.
4. Kurs nusxasining materiallari qoralama, talabalar soni nol va fayllari asl kursdan mustaqil bo'lishi.
5. Reminder workerni takror ishlatish bitta eslatma yaratishi; topshirilgan ishga eslatma yuborilmasligi.
6. 100% o'qilgan, hali baholanmagan kurs jurnalida joriy natija `—` bo'lishi; 0 ball baholangan natija `0` bo'lishi.
7. Topshiriqni baholash va keyingi ishga o'tish ball/izohni serverda saqlashi.

## Avtomatik tekshiruv natijalari

2026-09-05:

- Frontend: `npm run build` muvaffaqiyatli; `npm run test:run -- --maxWorkers=2` — 85 fayldagi 571 test o'tdi.
- Backend: `testNoDocker` — 94 test o'tdi, 3 ta muhitga bog'liq test o'tkazib yuborildi.
- Alohida vaqtinchalik PostgreSQL bazasida `WorkspaceIntegrationTest`, `QuizWorkflowIntegrationTest`, `CourseLifecycleIntegrationTest`, `AssignmentWorkflowIntegrationTest` — 24 test o'tdi. V72 migratsiyasi va entity-schema mosligi shu bazada tekshirildi. Test bazasi ish tugagach o'chirildi.
- Brauzer tarixidagi eski test holatidan qat'i nazar server javoblarini tiklash alohida komponent testi bilan tekshirildi.
