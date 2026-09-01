# SCORM LMS foydalanuvchi qo'llanmasi

## 1. Dastur nima uchun ishlatiladi?

SCORM LMS universitetning masofaviy ta'lim jarayonini boshqaradi. Tizimda:

- universitet va akademik tuzilma kiritiladi;
- yo'nalish, fan, o'quv reja va guruhlar yaratiladi;
- o'qituvchi hamda talabalar ro'yxatga olinadi;
- o'qituvchiga fan yoki fan oqimi biriktiriladi;
- kurs, bo'lim, mavzu va o'quv materiallari yaratiladi;
- topshiriq, test, yakuniy nazorat, davomat va baholar yuritiladi;
- hisobot, audit va monitoring ma'lumotlari ko'riladi.

Tizimdagi ma'lumotlar bir-biriga bog'langan. Shu sababli kursdan boshlash to'g'ri emas. Avval universitet tuzilmasi, keyin yo'nalish va fanlar, so'ng o'qituvchi va talabalar, undan keyin kurs kiritiladi.

## 2. Asosiy tushunchalar

Quyidagi atamalarni farqlash muhim:

| Atama | Ma'nosi | Misol |
|---|---|---|
| Fakultet | Universitetning yirik akademik bo'limi | Fizika-matematika fakulteti |
| Kafedra | Fakultet tarkibidagi bo'lim | Fizika kafedrasi |
| Yo'nalish | Talaba tahsil oladigan ta'lim dasturi | Fizika, bakalavr |
| Fan kategoriyasi | Fanlarni umumiy toifaga ajratadi | Fizika, Matematika |
| Fan | O'quv rejaga qo'shiladigan fan | Mexanika, Optika |
| O'quv reja | Yo'nalish fanlari va semestrlarini belgilaydi | Fizika 2026–2027 o'quv rejasi |
| Asosiy guruh | Talabaning doimiy akademik guruhi | FIZ-101 |
| Fan oqimi | Muayyan fan uchun o'qituvchi va talabalar guruhi | Mexanika, 1-oqim |
| Kurs | O'qituvchi tayyorlaydigan elektron ta'lim maydoni | Mexanika asoslari |
| Section/modul | Kurs ichidagi yirik bo'lim | 1-modul. Kinematika |
| Dars/material | Modul ichidagi video, PDF, matn, havola yoki SCORM material | Tezlik va tezlanish |

`Fan kategoriyasi`, `fan`, `fan oqimi` va `kurs` bir xil narsa emas.

## 3. Dasturdagi rollar

Tizimda hozir 7 ta asosiy rol mavjud.

### 3.1. Super Admin

Eng yuqori texnik va tashkiliy rol.

Asosiy vazifalari:

- administrator va boshqa foydalanuvchilarni boshqarish;
- mavjud rollarni biriktirish;
- yangi tizim rolini yaratish yoki rol tuzilmasini boshqarish;
- universitetning barcha asosiy ma'lumotlarini boshqarish;
- integratsiyalar va tizim sozlamalarini yuritish;
- audit loglarini ko'rish;
- akademik tuzilma va kurslarni boshqarish;
- UAT va tasdiqlash jarayonlarini boshqarish.

Bu rolni kundalik kurs kiritish uchun ishlatish tavsiya etilmaydi. U tizim sozlamalari va favqulodda boshqaruv uchun saqlanadi.

### 3.2. Admin

Universitet bo'yicha kundalik ma'muriy ishlarni bajaradi.

Asosiy vazifalari:

- foydalanuvchi, o'qituvchi va talaba akkauntlarini boshqarish;
- fakultet, kafedra, yo'nalish, guruh va fanlarni kiritish;
- o'quv yili, semestr va o'quv rejalarni yaratish;
- o'qituvchiga fan va fan oqimini biriktirish;
- talabalarni dastur, guruh va o'quv rejaga biriktirish;
- kurslar va kontentni umumiy nazorat qilish;
- imtihon, hisobot, audit va integratsiyalar bilan ishlash;
- parol berish, akkauntni faollashtirish yoki bloklash.

Admin odatda tizimni dastlabki ma'lumot bilan to'ldiradigan asosiy foydalanuvchi hisoblanadi.

### 3.3. Metodist

Ta'lim mazmuni va akademik jarayon uchun javobgar rol.

Asosiy vazifalari:

- yo'nalish, fan va o'quv reja ma'lumotlarini yuritish;
- fan kategoriyasi va fan oqimlarini boshqarish;
- o'quv dasturi/sillabusni yuritish;
- o'qituvchi va talabalarning akademik bog'lanishlarini ko'rish;
- kurs va kontentni tekshirish;
- hisobot, statistika va sifat monitoringini ko'rish;
- kontent ekspertizasi jarayonida qatnashish.

Metodist foydalanuvchi parolini almashtirish yoki tizim rollarini boshqarish uchun mo'ljallanmagan.

### 3.4. O'qituvchi

O'ziga biriktirilgan fan va kurslar bo'yicha ishlaydi.

Asosiy vazifalari:

- yangi kurs yaratish;
- kursga bo'lim va mavzular qo'shish;
- video, PDF, matn, havola va SCORM material joylash;
- topshiriq va test yaratish;
- dars jadvali yoki jonli mashg'ulot ma'lumotini kiritish;
- kurs talabalarini ko'rish;
- davomat va baholarni yuritish;
- e'lon va xabar yuborish;
- o'z kurslari bo'yicha hisobotlarni ko'rish.

O'qituvchi kurs yaratishi uchun unga kamida bitta faol `fan` yoki faol `fan oqimi` biriktirilgan bo'lishi kerak.

### 3.5. Talaba

Faqat o'ziga tegishli ta'lim ma'lumotlari bilan ishlaydi.

Asosiy imkoniyatlari:

- o'z kurslarini ochish;
- kurs materiallarini o'rganish;
- o'quv rejasi va dars jadvalini ko'rish;
- topshiriq yuborish;
- test va imtihonda qatnashish;
- baho va davomatni ko'rish;
- xabar va bildirishnomalarni olish;
- profil, amaliyot, orientatsiya va tegishli hujjatlarni ko'rish;
- anonim so'rovda qatnashish.

Talaba kurs, fan yoki boshqa foydalanuvchini yarata olmaydi.

### 3.6. Proktor

Nazorat qilinadigan imtihon jarayoni uchun mo'ljallangan.

Asosiy vazifalari:

- imtihon sessiyasini nazorat qilish;
- proktoring hodisalarini ko'rish;
- shubhali holatlarni qayd etish;
- imtihon paytidagi monitoring bilan ishlash;
- texnik yordamga murojaat qilish.

Proktor kurs yoki akademik ma'lumotlarni o'zgartirmaydi.

### 3.7. Monitoring

Asosan faqat o'qish va tahlil qilish huquqiga ega nazorat roli.

Asosiy vazifalari:

- statistika va hisobotlarni ko'rish;
- audit ma'lumotlarini ko'rish;
- sifat monitoringi va anonim so'rov natijalarini ko'rish;
- 559-son qaror bo'yicha holatni kuzatish;
- infratuzilma, rasmiy sayt axborotlari va integratsiyalar holatini ko'rish.

Monitoring roli odatda ma'lumot yaratmaydi yoki tahrirlamaydi.

### 3.8. Dekan va kafedra mudiri haqida

Hozirgi versiyada alohida `Dekan`, `Kafedra mudiri` yoki `Operator` roli mavjud emas. Ularning vazifalari hozircha quyidagicha taqsimlanadi:

- akademik ma'lumot kiritish — `Admin` yoki `Metodist`;
- o'qituvchini fan va oqimga biriktirish — `Admin` yoki `Metodist`;
- foydalanuvchi/parol boshqaruvi — `Admin` yoki `Super Admin`;
- faqat hisobot va nazorat — `Monitoring`.

## 4. Rollarning qisqa taqqoslanishi

| Amal | Super Admin | Admin | Metodist | O'qituvchi | Talaba | Proktor | Monitoring |
|---|---:|---:|---:|---:|---:|---:|---:|
| Foydalanuvchi yaratish/boshqarish | Ha | Ha | Cheklangan | Yo'q | Yo'q | Yo'q | Faqat ko'rish |
| Tizim rolini boshqarish | Ha | Cheklangan | Yo'q | Yo'q | Yo'q | Yo'q | Yo'q |
| Akademik tuzilma kiritish | Ha | Ha | Ha | Faqat ko'rish | Yo'q | Yo'q | Faqat hisobot |
| O'qituvchi va talabani kiritish | Ha | Ha | Akademik qismi | Yo'q | Yo'q | Yo'q | Faqat ko'rish |
| Kurs yaratish | Ha | Ha | Ha | Ha, o'z fani bo'yicha | Yo'q | Yo'q | Yo'q |
| Kontent joylash | Ha | Ha | Ha | Ha, o'z kursida | Yo'q | Yo'q | Yo'q |
| Topshiriq/test yaratish | Ha | Ha | Ha | Ha | Yo'q | Yo'q | Yo'q |
| Test yechish | Texnik ruxsat mavjud | Yo'q | Yo'q | Yo'q | Ha | Yo'q | Yo'q |
| Imtihonni nazorat qilish | Ha | Cheklangan | Yo'q | O'z nazorati | Yo'q | Ha | Faqat ko'rish |
| Hisobot ko'rish | Ha | Ha | Ha | O'z sohasi | O'z natijasi | Yo'q | Ha |
| Audit ko'rish | Ha | Ha | Yo'q | Yo'q | Yo'q | Yo'q | Ha |

## 5. Ma'lumotlarni kiritishning to'g'ri ketma-ketligi

Quyidagi tartib birinchi ishga tushirish uchun tavsiya etiladi.

### 1-bosqich. Asosiy ma'lumotnomalar

Mas'ul rol: `Admin` yoki `Super Admin`.

Avval quyidagilar tekshiriladi yoki kiritiladi:

- davlatlar;
- viloyat/hududlar;
- tumanlar;
- millatlar;
- tizim tillari;
- zarur umumiy yorliqlar.

Bu ma'lumotlar talaba va universitet kartochkalaridagi select maydonlarini to'ldiradi.

### 2-bosqich. Universitet tuzilmasi

Mas'ul rol: `Admin`.

Ketma-ketlik:

1. `Universitetlar` bo'limida universitetni kiriting.
2. `Tuzilishi → Fakultetlar` bo'limida fakultet yarating.
3. `Kafedralar` bo'limida kafedrani fakultetga bog'lang.
4. `Yo'nalishlar/Mutaxassisliklar` bo'limida ta'lim yo'nalishini yarating.

Yo'nalishda kamida nom, kod, ta'lim darajasi, ta'lim tili va faol holat to'g'ri bo'lishi kerak.

### 3-bosqich. O'quv davri

Mas'ul rol: `Admin` yoki `Metodist`.

1. `O'quv yillari`ni yarating, masalan `2026–2027`.
2. Shu yil uchun semestrlarni kiriting.
3. Boshlanish va tugash sanalarini belgilang.
4. Ishlatiladigan davrni faol holatga o'tkazing.

### 4-bosqich. Fan kategoriyasi va fanlar

Mas'ul rol: `Admin` yoki `Metodist`.

1. `Fan guruhlari` yoki `Fan kategoriyalari` bo'limida kategoriya yarating.
2. Masalan, `Fizika` kategoriyasini kiriting.
3. `Fanlar` bo'limiga o'ting.
4. `Mexanika`, `Optika`, `Laboratoriya mashg'ulotlari` kabi fanlarni kiriting.
5. Har bir fanga kod, kredit, yo'nalish va kategoriya tanlang.
6. Fan faol ekanini tekshiring.

Kurs yaratish formasidagi kategoriya nomi shu ma'lumotdan olinadi.

### 5-bosqich. O'quv reja

Mas'ul rol: `Metodist` yoki `Admin`.

1. `O'quv rejalari` bo'limidan yangi reja yarating.
2. Yo'nalish va o'quv yilini tanlang.
3. Versiya kodi yoki reja nomini kiriting.
4. Rejaga fanlarni qo'shing.
5. Har bir fan uchun semestr, kredit va `majburiy/tanlov` turini belgilang.
6. Rejani tekshirib, tasdiqlash/nashr jarayonidan o'tkazing.

Tasdiqlanmagan yoki noto'g'ri bog'langan reja fan oqimlarini yaratishda ko'rinmasligi mumkin.

### 6-bosqich. Asosiy talabalar guruhlari

Mas'ul rol: `Admin` yoki `Metodist`.

1. `Talabalar guruhlari` yoki `Asosiy guruhlar` bo'limiga o'ting.
2. Guruh kodi va nomini kiriting.
3. Guruhni yo'nalish, o'quv yili va kerakli semestrga bog'lang.
4. Guruhni faol holatga o'tkazing.

### 7-bosqich. O'qituvchini yaratish

Mas'ul rol: `Admin`.

1. `O'qituvchilar` bo'limida yangi o'qituvchi kartochkasini yarating.
2. F.I.Sh., telefon, email, kafedra, lavozim va ilmiy ma'lumotlarni kiriting.
3. O'qituvchiga login akkaunti yarating yoki mavjud loginni bog'lang.
4. O'qituvchiga dars beradigan fanlarni biriktiring.
5. O'qituvchi va akkaunt faol ekanini tekshiring.

Muhim: faqat profil yaratish yetarli emas. `Fanlar` ham biriktirilishi kerak.

### 8-bosqich. Fan oqimini yaratish

Mas'ul rol: `Admin` yoki `Metodist`.

Fan oqimi bir fan bo'yicha o'qituvchi va talabalarni birlashtiradi.

1. `Fan oqimlari` bo'limiga o'ting.
2. O'quv rejadagi fanni tanlang.
3. Oqim kodi va nomini kiriting.
4. Sig'im va faol holatni belgilang.
5. O'qituvchini oqimga biriktiring.
6. Talabalarni oqimga qo'shing.

O'qituvchini oqimga qo'shish uchun avval o'qituvchi kartochkasida o'sha fan unga biriktirilgan bo'lishi kerak.

### 9-bosqich. Talabani kiritish

Mas'ul rol: `Admin`.

Tavsiya etilgan uch qadam:

1. `Kartochka` — F.I.Sh., talaba raqami, hujjat va aloqa ma'lumotlarini kiriting.
2. `Parol va kirish` — talaba akkauntiga dastlabki parol bering va loginni faollashtiring.
3. `O'qishga biriktirish` — qabul buyrug'i, yo'nalish, o'quv yili va asosiy guruhni tanlang.

Shundan keyin:

- talabani tegishli o'quv rejaga biriktiring;
- kerakli fan oqimlariga qo'shing;
- talaba holati `ACTIVE` ekanini tekshiring.

### 10-bosqich. Kurs yaratish

Mas'ul rol: `O'qituvchi`; zaruratda `Admin` yoki `Metodist`.

O'qituvchi `Mening kurslarim → Yangi kurs` orqali forma ochadi.

Maydonlar:

- `Kurs nomi` — talaba ko'radigan to'liq nom;
- `Qisqa tavsif` — kurslar ro'yxatida ko'rinadigan izoh;
- `Batafsil tavsif` — kursning maqsadi va mazmuni;
- `Kategoriya / fan` — o'qituvchiga biriktirilgan fan yoki fan oqimi;
- `Kurs darajasi` — boshlang'ich, o'rta yoki yuqori;
- `Kurs tili` — materiallarning asosiy tili;
- `Narxlash turi` — bepul yoki pullik;
- `Narx/chegirma` — faqat pullik kursda;
- `Amal qilish muddati` — doimiy yoki cheklangan;
- `Boshlanish/tugash sanasi` — kurs davri;
- `Kurs rasmi` — JPG, PNG yoki WEBP, maksimum 10 MB;
- `Darslarni bosqichma-bosqich ochish` — mavzularni ketma-ket ochish rejimi.

Yaratilgan kurs avval `Qoralama/DRAFT` holatida saqlanadi.

### 11-bosqich. Kurs tarkibini to'ldirish

Mas'ul rol: `O'qituvchi`.

Kurs ichidagi tavsiya etilgan tartib:

1. `Curriculum` bo'limida section/modul yarating.
2. Masalan: `1-mavzu`, `2-mavzu`, `Amaliy mashg'ulot`.
3. Har bir modul ichiga dars qo'shing.
4. Dars turini tanlang: matn, havola, video, PDF/fayl yoki SCORM.
5. Dars nomi, tavsifi, tili, muallif va manba ma'lumotlarini kiriting.
6. Darslarning tartibini joyiga qo'ying.
7. Zarur bo'lsa kontentni tekshiruvga yuboring.
8. `Assignment` bo'limida topshiriqlar yarating.
9. `Testlar` bo'limida savol va testlar yarating.
10. `Live Class` bo'limida jonli dars ma'lumotlarini kiriting.
11. `Info`, `Media` va `SEO` bo'limlarini to'ldiring.

### 12-bosqich. Talabani kursga biriktirish va kursni nashr qilish

Mas'ul rol: `O'qituvchi`, `Metodist` yoki `Admin`.

Nashrdan oldin tekshiring:

- kursga fan yoki fan oqimi bog'langan;
- o'qituvchi shu fan bo'yicha vakolatli;
- kurs tili yo'nalish/o'quv reja tiliga mos;
- kursda kamida kerakli bo'lim va materiallar mavjud;
- materiallarning tekshiruv holati talabga mos;
- talabalar to'g'ri dastur va tilga mansub;
- kurs sanalari to'g'ri.

So'ng talabalarni kursga biriktiring va kurs holatini `PUBLISHED/Nashr qilingan`ga o'tkazing.

## 6. O'qituvchining kundalik ish tartibi

1. Dashboarddan bugungi holatni tekshiradi.
2. `Mening kurslarim`dan kursni ochadi.
3. Yangi mavzu yoki material qo'shadi.
4. E'lon yuboradi.
5. Topshiriqlarni va yuborilgan ishlarni tekshiradi.
6. Test yoki yakuniy nazoratni boshqaradi.
7. Davomat va baholarni kiritadi.
8. Hisobotdan kurs faolligini ko'radi.

O'qituvchi boshqa o'qituvchining kursini tahrirlamasligi kerak. Admin va metodistda kengroq nazorat huquqi mavjud.

## 7. Talabaning kundalik ish tartibi

1. Login orqali tizimga kiradi.
2. `LMS orientatsiyasi` talabini bajaradi.
3. `O'quv rejam`dan fanlarini tekshiradi.
4. `Mening kurslarim`dan kursni ochadi.
5. Mavzularni ketma-ket o'rganadi.
6. Topshiriqni belgilangan muddatda yuboradi.
7. Test va imtihonlarda qatnashadi.
8. `Baholar` va `Davomat` bo'limlarini tekshiradi.
9. Xabar va bildirishnomalarni kuzatadi.

## 8. Kurs holatlari

| Holat | Ma'nosi |
|---|---|
| DRAFT / Qoralama | Kurs tayyorlanmoqda, talabaga to'liq ochilmagan |
| PUBLISHED / Nashr qilingan | Kurs foydalanishga ochilgan |
| ARCHIVED / Arxiv | Kurs faol o'qitishdan chiqarilgan, tarix saqlanadi |

Faol kursni oddiy o'chirish o'rniga avval arxivlash tavsiya etiladi. Audit va o'qish tarixi saqlanishi kerak.

## 9. Ko'p uchraydigan muammolar

### “Kategoriya / fan” ro'yxati bo'sh

Sabablar:

- o'qituvchiga fan biriktirilmagan;
- o'qituvchiga fan oqimi biriktirilmagan;
- fan yoki oqim nofaol;
- o'quv reja tasdiqlanmagan;
- o'qituvchi akkaunti profilga bog'lanmagan.

Yechim:

1. Admin `O'qituvchilar` bo'limini ochadi.
2. O'qituvchi kartochkasiga fan biriktiradi.
3. Zarur bo'lsa `Fan oqimlari`da o'qituvchini oqimga qo'shadi.
4. O'qituvchi tizimdan chiqib qayta kiradi yoki sahifani yangilaydi.

### “Kurs yaratish” tugmasi faol emas

Kurs nomi va `Kategoriya / fan` tanlanganini tekshiring. Select bo'sh bo'lsa, yuqoridagi fan biriktirish jarayonini bajaring.

### Kurs talaba kabinetida ko'rinmaydi

Tekshiring:

- kurs hali qoralama holatida emasmi;
- talaba kursga biriktirilganmi;
- talaba holati faolmi;
- talaba to'g'ri yo'nalish va guruhga biriktirilganmi;
- kurs va talaba ta'lim tili mosmi;
- kurs arxivlanmaganmi.

### 403 yoki “Ruxsat yo'q” xatosi

Foydalanuvchining roli ushbu amal uchun yetarli emas. Admin akkauntdagi rolni va akkaunt faol holatini tekshiradi.

### Select maydonida ma'lumot chiqmayapti

Ko'pincha oldingi bosqichdagi ma'lumot yaratilmagan yoki faol emas. Masalan, yo'nalish bo'lmasa o'quv reja; fan bo'lmasa fan oqimi; fan biriktirilmasa kurs yaratib bo'lmaydi.

### Kurs rasmi yuklanmayapti

Fayl JPG, JPEG, PNG yoki WEBP formatida va 10 MB dan kichik bo'lishi kerak.

### Pullik kurs saqlanmayapti

Asosiy narx 0 dan katta bo'lishi kerak. Chegirma yoqilgan bo'lsa, chegirmali narx asosiy narxdan kichik bo'lishi shart.

## 10. Tavsiya etilgan mas'uliyat taqsimoti

| Ish | Tavsiya etilgan mas'ul |
|---|---|
| Tizim va rollar | Super Admin |
| Foydalanuvchi/parol | Admin |
| Fakultet, kafedra, yo'nalish | Admin |
| O'quv yil va semestr | Admin + Metodist |
| Fan kategoriyasi va fan | Metodist |
| O'quv reja va sillabus | Metodist |
| O'qituvchi va talaba kartochkasi | Admin |
| Fan oqimi va biriktirishlar | Metodist + Admin |
| Kurs va material | O'qituvchi |
| Kontent tekshiruvi | Metodist |
| Davomat va baholash | O'qituvchi |
| Umumiy hisobot | Admin + Metodist |
| Mustaqil nazorat | Monitoring |
| Proktoring | Proktor |

## 11. Ishni boshlash uchun minimal variant

Faqat bitta sinov kursini ishga tushirish uchun kamida quyidagilar bo'lishi kerak:

1. Bitta universitet.
2. Bitta fakultet va kafedra.
3. Bitta yo'nalish.
4. Bitta fan kategoriyasi, masalan `Fizika`.
5. Bitta faol fan, masalan `Mexanika`.
6. Fan biriktirilgan faol o'qituvchi va uning login akkaunti.
7. Kamida bitta faol talaba va uning login akkaunti.
8. O'qituvchi yaratgan qoralama kurs.
9. Kurs ichida kamida bitta modul va bitta material.
10. Talabaning kursga biriktirilishi.
11. Kursning nashr qilinishi.

To'liq akademik ishlash uchun bunga o'quv yil, semestr, o'quv reja, asosiy guruh va fan oqimi ham qo'shiladi.

## 12. Xavfsizlik bo'yicha tavsiyalar

- Barcha xodimlarga Admin rolini bermang.
- O'qituvchiga faqat o'z fanlarini biriktiring.
- Talabaga faqat Student rolini bering.
- Monitoring foydalanuvchisiga tahrirlash huquqini bermang.
- Super Admin akkauntidan kundalik ish uchun foydalanmang.
- Dastlabki parolni xavfsiz kanal orqali bering va almashtirishni talab qiling.
- Faoliyat tarixini saqlash uchun ma'lumotni izsiz o'chirish o'rniga status/arxivdan foydalaning.
- Real ish boshlashdan oldin rollar bilan alohida test akkauntlarida tekshiruv o'tkazing.

## 13. Tavsiya etilgan sinov ssenariysi

1. Admin test fan va o'qituvchi yaratadi.
2. O'qituvchiga test fanini biriktiradi.
3. O'qituvchi login qilib yangi kurs yaratadi.
4. Kursga bitta modul, PDF va test qo'shadi.
5. Admin test talabani yaratadi va kursga biriktiradi.
6. Kurs nashr qilinadi.
7. Talaba login qilib kursni ochadi va topshiriq/testni bajaradi.
8. O'qituvchi natija va davomatni tekshiradi.
9. Monitoring rolida hisobot o'qiladi.

Shu ssenariy muvaffaqiyatli o'tsa, keyin real ma'lumotlarni ommaviy kiritishni boshlash mumkin.
