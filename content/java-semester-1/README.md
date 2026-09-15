# Java dasturlash asoslari — 1-semestr

Dasturiy injinering / Dasturlash Asoslari uchun 15 haftalik o‘zbekcha kurs paketi.
6 kredit, 180 akademik soat **taklif**: 30 nazariya + 30 laboratoriya + 120 mustaqil ish.
Rasmiy tasdiqlangan dastur sifatida ko‘rsatilmaydi.

Tarkib: 16 modul, 50 matnli material, 22 video havola, 15 baholanadigan topshiriq,
60 savol, 15 haftalik test, oraliq test, yakuniy test va 15 ishlaydigan Java misoli.

- `student/syllabus.html`: o‘quv reja, o‘qish tartibi, yuklama va baholash.
- `student/weeks/`: nazariya, kod, laboratoriya, topshiriq, qabul mezonlari.
- `student/examples/`: JDK 21 bilan bajariladigan mustaqil misollar.
- `student-package.zip`: talaba uchun yuklab olinadigan materiallar.
- `instructor/answer-key.md`: faqat o‘qituvchi uchun javoblar va izohlar.
- `course.json`: LMSga import qilinadigan to‘liq kontent; javoblar kalitini ham saqlaydi.
- `video-sources.json`: muallif, manba, til va tekshirish usuli.

Videolar tashqi YouTube havolalari. 14 ta o‘zbekcha, 8 ta inglizcha video yozuvi mavjud;
inglizcha yozuvlar qo‘shimcha manba sifatida belgilangan. 19 ta turli video manbasi,
ayrimlarining mavzuga mos vaqt belgisi ishlatilgan. Media fayllari yuklab olinmagan.
O‘zbekcha nazariya va amaliy ishlar videoga bog‘lanmagan holda o‘qiladi.
2026-09-14 kuni YouTube oEmbed metadata tekshirildi; barcha videolar to‘liq tomosha qilinmagan.

## Paketni qayta yaratish va tekshirish

```powershell
python content/java-semester-1/build.py
python content/java-semester-1/verify_examples.py
```

Python 3 va JDK 21 kerak. `JAVA_HOME` bo‘lsa shu JDK ishlatiladi, aks holda PATH.
Tekshiruv kompilyatsiya natijalarini vaqtinchalik papkada saqlaydi.

## LMSga import

LMS ishga tushgan bo‘lishi, fan mavjud bo‘lishi va o‘qituvchiga biriktirilgan bo‘lishi kerak.
Importer `requests` kutubxonasini ishlatadi. Parollar interaktiv so‘raladi yoki
`LMS_TEACHER_PASSWORD` va `LMS_ADMIN_PASSWORD` muhit o‘zgaruvchilaridan olinadi.

```powershell
python content/java-semester-1/import_course.py --username demo_teacher --admin-username demo_admin
```

Normal API ruxsatlari ishlatiladi. Kurs, materiallar, topshiriqlar, testlar va syllabus
qoralama holatida yaratiladi. `--admin-username` akademik syllabus yozuvini qo‘shish uchun;
berilmasa syllabus baribir kursning birinchi modulida mavjud.
Importer bir vaqtda bitta jarayonda ishlatiladi. Qayta ishga tushirish mavjud nomlarni
qayta yaratmaydi, tahrirlarni bosib yozmaydi; topilgan kontent farqlarini hisobotga yozadi.
Nashrdagi kursni o‘zgartirmaydi. Parol/tokenlar faylga saqlanmaydi.

`--start-date YYYY-MM-DD` bilan birinchi importdagi semestr boshlanishini o‘zgartirish mumkin.
Syllabusdagi namunaviy sanalarni ham moslashtirish kerak. Sukut sanasi 2026-09-14;
haftalik topshiriqlar yakshanba 23:59 Toshkent vaqti uchun qoralama sifatida yaratiladi.

## O‘qituvchi uchun tayyorlash qaydlari

- Baholash taqsimoti taklif sifatida syllabusda yozilgan; gradebook koeffitsientlari avtomatik sozlanmagan.
- Mahalliy Dasturiy injinering yo‘nalishida masofaviy ta’lim sozlamasi o‘chiq. Import uni o‘zgartirmaydi.
- Inglizcha tashqi videolar `en` deb saqlanadi. Tizim uz kursda en kontent nashrini cheklashi mumkin;
  nashrdan oldin ushbu qo‘shimchalarni o‘zbekcha videoga almashtirish yoki muassasa til siyosatiga mos joylashtirish kerak.
- Rasmiy curriculum tasdiqlash raqami, mustaqil ekspert qarori va talaba yozilishi soxtalashtirilmaydi.
- O‘qituvchi mazmunni tekshirib, muddatlar va baholashni muassasa tartibiga moslashtiradi.

Manbalar: [dev.java](https://dev.java/learn/),
[Akramjon Pulatov videolari](https://www.youtube.com/@pulatovakram),
[freeCodeCamp Java kursi](https://www.youtube.com/watch?v=GoXwIVyNvX0),
[Bro Code](https://www.youtube.com/@BroCodez).
