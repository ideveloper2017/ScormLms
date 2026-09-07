# O‘quv jarayoni auditi — 2026-09-07

HEMIS foydalanuvchi topshirig‘i bilan keyinga qoldirildi. Ushbu ish LMS ichidagi o‘quv reja, semestr, talaba biriktirish, fan oqimi va dars jadvaliga tegishli.

## Tuzatilgan muammolar

| Jarayon | Oldingi holat | Natija |
| --- | --- | --- |
| O‘quv rejaga talaba biriktirish | Faqat dastlabki 100 talaba yuklanib, semestr keyin brauzerda saralangan. Keyingi talabalar ko‘rinmagan. | Semestr, qidiruv va avval biriktirilganlarni chiqarish serverda sahifalashdan oldin bajariladi. 20 talabalik sahifalar, keyingi/oldingi, sahifadagilarni tanlash va tanlovni tozalash mavjud. |
| Semestr muddati | Reja 4 semestrli bo‘lsa ham 12 semestr tanlash mumkin; noto‘g‘ri sanalar faqat yuborilganda rad etilgan. | Rejaning semestr soni ishlatiladi. Sana ketma-ketligi va amal qilish davri oldindan tekshiriladi; server ham reja chegarasini tekshiradi. |
| Biriktirish shartlari | O‘chiq tugmaning sababi tushunarsiz; o‘chirilgan akkaunt faol akademik holatda qolsa biriktirish mumkin bo‘lgan. | Reja tasdiqlanmagani, nofaolligi yoki semestr muddati yo‘qligi ko‘rsatiladi. O‘chirilgan akkaunt o‘quv reja va fan oqimi nomzodlaridan chiqariladi; to‘g‘ridan-to‘g‘ri biriktirish ham rad etiladi. |
| Fan oqimi | Nomzodlardan faqat birinchi 20 talaba ko‘ringan. Yuklash xatosi bo‘sh ko‘rinishga o‘xshagan. | Sahifalash, yuklanish va xatodan keyin qayta urinish mavjud. Guruh almashganda sahifa yangilanadi. Sig‘im 1–500 butun son bilan tekshiriladi. |
| Admin navigatsiyasi | Fan oqimlari va kurslar ta’lim menyusida ko‘rinmagan; jadval yangiliklar ichida bo‘lgan. | “Fan oqimlari”, “Kurslar” va “Dars jadvali” ta’lim jarayoniga qo‘shildi. “Fan guruhlari” fanlar katalogi sifatida saqlandi. |
| Dars jadvali | Darslarni nom va holat bo‘yicha ajratish yo‘q; tugash vaqti oldin bo‘lsa saqlash tugmasi faol. | Kurs/dars nomi bo‘yicha qidiruv, holat filtri va mos bo‘sh natija xabari bor. Noto‘g‘ri vaqt bilan yuborish oldindan to‘xtatiladi. |
| O‘quv yili/semestr katalogi | So‘rov xatosida ro‘yxat bo‘sh ko‘rinishi mumkin. | Yuklanish va xato holati, qayta urinish qo‘shildi. |

## Qabul tekshiruvlari

- Alohida PostgreSQL bazasida 101 ta boshqa semestr talabasi va 22 ta mos talaba yaratildi. Bir talaba avval biriktirilgach, qolgan 21 tasi 10/10/1 sahifalarda to‘liq chiqdi. Biriktirish olib tashlangach 22 nomzod qaytdi. Ism-familiya bo‘yicha qidiruv va `%` belgisi oddiy matn sifatida tekshirildi.
- Reja chegarasidan tashqaridagi semestr va o‘chirilgan akkauntni biriktirish rad etilishi tekshirildi.
- O‘quv reja yaratish, fan qo‘shish, alohida tasdiqlash, fan oqimiga o‘qituvchi/talaba biriktirish va dars jadvalini talaba ochishi uchun mavjud integratsiya testlari ishlatildi.
- Frontendda ikkinchi sahifadagi talabani tanlash va biriktirish, semestr/qidiruv so‘rovi, noto‘g‘ri sana, yuklash xatosi, fan oqimida sahifalash hamda jadval filtrlari tekshirildi.
- Yangi frontend testi dastlabki qidiruv taymeri keyingi sahifani 0 ga qaytarishini aniqladi; o‘zgarmagan qidiruv uchun taymer ishga tushmaydigan qilindi.
- Eski fan oqimi testida kurs yaratish xizmati o‘qituvchi cheklovisiz chaqirilgan edi. Test haqiqiy controller singari `enforceTeachingScope=true` bilan tekshirishga moslandi; amaldagi ruxsat qoidasi bo‘shatilmadi.

## Qolgan ishlar

Natija: 16 turli backend testi (6 o‘quv reja, 5 fan oqimi, 3 davr katalogi, 2 dars jadvali) va 25 frontend testi o‘tdi. TypeScript va production build muvaffaqiyatli. Test bazasi o‘chirildi, lokal backend qayta ishga tushirildi.

Brauzerda yangi menyu, demo rejaning 8 semestri va 2 ta mavjud biriktirishi, fan oqimidagi talaba/o‘qituvchi ro‘yxati va dars jadvali filtri tekshirildi. Nashr qilingan darslar filtri yagona qoralama darsni yashirdi. Jonli API kurslar, mashg‘ulotlar, baholash tizimlari va oddiy/yakuniy vedomost ro‘yxatlarini muvaffaqiyatli qaytardi. Amaldagi talaba biriktirishlari bu tekshiruvda o‘zgartirilmadi.

Ko‘p talaba bilan biriktirish va o‘chirish amallari test bazasida bajarildi; foydalanuvchining amaldagi talabalariga sinov o‘zgarishlari kiritilmadi.

## Ikkinchi bosqich — baholash va kundalik ish oqimlari

Foydalanuvchi tasdiqlagan olti muammo bo‘yicha o‘zgarishlar:

1. **O‘tish bali:** talabaning o‘quv yili va semestriga biriktirilgan tasdiqlangan/arxivlangan reja ishlatiladi. Chegara maksimal ballga nisbatan foizga keltiriladi. Reja tasdiqlanganda chegara saqlanadi va baholash katalogi keyinchalik o‘zgarsa tarixiy natijaga ta’sir qilmaydi. Rejasi yo‘q eski biriktirishlar uchun avvalgi 60% qoida saqlanadi. Qarzdorlik, imtihon natijalari va talaba kredit/GPA hisoblari shu chegaradan foydalanadi. Bir davrga turli chegarali rejalar biriktirilgan bo‘lsa, tasodifiy reja tanlanmaydi: xato bildiriladi.
2. **Vedomost:** “Ochish” orqali talaba, davomat, ball, o‘tish chegarasi va izoh ko‘rinadi. Yetishmagan davomat yoki baholar alohida ko‘rsatiladi. REPORT_READ va ACADEMIC_WRITE vakolatli xodim tekshirganini belgilagach yakunlay oladi. Mavjud imtihon yakunlash qoidalari va audit qayta ishlatiladi. Yakunlangan natija faqat apellyatsiya jarayoni orqali o‘zgartiriladi. Qatorni qulflash baholash/yakunlashning bir vaqtda bajarilishini tartiblaydi.
3. **Eksport:** vedomost, GPA, test va akademik natijalar sahifalarida matnli qidiruv CSVga ham qo‘llanadi. Umumiy xavfsiz CSV yordamchisi formula sifatida talqin qilinadigan matnlarni himoyalaydi. Talaba o‘rtachalari o‘quv yili/semestr/dastur kesimida ajratildi.
4. **Dars jadvali:** qoralama va hali boshlanmagan nashrdagi dars uchun tahrirlash bor. Nom, tavsif, sana, vaqt, xona, bino va havolalar mavjud ID bilan yangilanadi; kurs va holat almashtirilmaydi. Tayyor videoaloqa uchrashuvi mavjud bo‘lsa, serverning avval uni bekor qilish talabi oldindan tushuntiriladi. Videoaloqa yaratishda xato bo‘lsa, saqlangan dars qayta yaratilmaydi.
5. **Rejani tasdiqlash:** muallif IDsi frontendga qaytariladi. Oddiy muallif uchun tasdiqlash tugmasi o‘chiriladi va boshqa vakolatli xodim kerakligi yoziladi. Mavjud super_admin istisnosi saqlanadi.
6. **Sillabus:** Qoralama → Tekshiruvda → Tasdiqlangan jarayoni, tahrirga qaytarish, yangi versiya ochish va tasdiqlangan nusxalarni o‘qish qo‘shildi. Tasdiqlangan nusxa to‘g‘ridan-to‘g‘ri tahrirlanmaydi/o‘chirilmaydi. Har bir tasdiqlangan versiyaning mazmuni, tasdiqlovchisi va sanasi saqlanadi. Fanlar yuklanmasa sabab va qayta urinish ko‘rsatiladi. Eski katalog yozuvlari tasdiqlash dalili bo‘lmagani uchun 1-versiya qoralama sifatida boshlanadi.

Migratsiyalar: V73 (sillabus holati va versiyalar tarixi), V74 (tasdiqlangan rejaning o‘tish foizi). HEMIS ishlari keyinga qoldirilgan holatda.

### Ikkinchi bosqich tekshiruvi

- 31 turli backend testi o‘tdi: baholash siyosati 6, akademik analitika 2, o‘quv reja 6, imtihon/vedomost 3, dars jadvali 3, sillabus 3, mavjud talaba hisobotlari va ish maydoni regressiyalari 8. Snapshot uchun ikkita testdagi MockK bog‘lanishi tuzatilib, baholash siyosatining barcha 6 testi qayta o‘tkazildi.
- 16 frontend testi o‘tdi: yangi oqimlar 7, avvalgi ta’lim jarayoni 6, xavfsiz CSV 1, akademik API 2. TypeScript va Vite production build muvaffaqiyatli. Mavjud katta bundle va MathType eval ogohlantirishlari buildni to‘xtatmaydi.
- Brauzerda amaldagi qoralama vedomost ochildi: bo‘sh ro‘yxat va boshlanmagan imtihon sababli yakunlash bloklandi. Mavjud dars tahrirga to‘g‘ri yuklandi va saqlamasdan bekor qilindi. Sillabus mazmuni, versiya holati va tarix oynasi ko‘rildi.
- Jonli API yangi reja muallifi maydonini, sillabus versiyalarini va akademik natijalarni qaytardi. Monitoring akkaunti bilan yangi tasdiqlash endpointlariga mavjud bo‘lmagan 0 ID orqali ruxsat tekshirildi; ikkisi ham 403 qaytardi.
- Mazmun, davomat, baholar va tasdiqlashning haqiqiy yozish sinovlari alohida PostgreSQL test bazasida bajarildi. Jonli foydalanuvchi hujjatlari ushbu UI tekshiruvida tasdiqlanmadi yoki tahrirlanmadi. Backend qayta ishga tushirildi, health: UP.
