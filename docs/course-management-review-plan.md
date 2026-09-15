# Kurslarni boshqarish: dastlabki taklif

Sana: 2026-09-14. Namuna: https://fizika.brainsmart.uz/dashboard/courses.

## Namuna saytga kirish holati

Brauzer `ERR_CERT_DATE_INVALID` bilan ulanishni to'xtatdi. TLS diagnostikasida `fizika.brainsmart.uz` sertifikati 2026-09-11 14:44:03 da tugagani ko'rindi (Asia/Tashkent). Sertifikat tekshiruvi chetlab o'tilmadi, login ma'lumotlari yuborilmadi. Sayt ichidagi kurslar va funksiyalar hali ko'rilmagan. Quyidagi taklif faqat lokal ScormLms kodiga asoslangan; namuna sayt bilan funksional taqqoslash hisoblanmaydi.

## Lokal kodda aniqlangan imkoniyatlar va takliflar

| Yo'nalish | Mavjud holat | Taklif | Qabul mezoni |
|---|---|---|---|
| Kurslar ro'yxati | Qidirish, holat filtri, sahifalash, yaratish, nusxalash, nashr va o'chirish amallari bor | Bitta aniq amallar menyusi; qoralama, nashr va arxiv orasidagi o'tishlar; har bir amal uchun yuborilayotgan holat | Ikki marta bosish takroriy so'rov bermaydi; muvaffaqiyat/xato holati tushunarli |
| O'chirish | Ro'yxatdagi tugma to'g'ridan-to'g'ri so'rov yuboradi; nashrdagi kurs uchun o'chirish bloklangan | Kurs nomi va amal oqibatini ko'rsatuvchi tasdiqlash oynasi | Bekor qilishda so'rov yuborilmaydi; boshqa kurs o'chirilmaydi |
| Kurs muharriri | Curriculum, Live Class, Assignment, Basic, Pricing, Info, Media, SEO, talabalar, forum va ekspertiza bo'limlari bor | O'zbekcha yagona atamalar; akademik va tijoriy maydonlarning vazifasini aniq ko'rsatish | Har bir bo'lim maqsadi va saqlash amali tushunarli; mobil ko'rinishda menyu kesilmaydi |
| Jonli darslar | Kurs sahifasi umumiy dars jadvaliga o'tkazadi | Joriy kurs bo'yicha jadval va oldindan tanlangan kurs bilan dars yaratish | Faqat tegishli kurs sessiyalari ko'rinadi; boshqa kursga tasodifiy bog'lanmaydi |
| Topshiriqlar | Kurs ichidan umumiy yaratish sahifasi ochiladi | Kurs topshiriqlari ro'yxati, muddat/holat, kurs kontekstini saqlab yaratish | Yaratilgan topshiriq aynan shu kursga bog'lanadi va ro'yxatda paydo bo'ladi |
| Darslar | Bo'lim, matn/fayl/havola, material biriktirish, tartiblash va ekspertiza holatlari mavjud | Kontent turlarini aniq tanlash; yuklash va validatsiya xatolarini tegishli maydonda ko'rsatish | Qayta ochilganda ma'lumot saqlanadi; muvaffaqiyatsiz yuklash nashr etilgan dars sifatida ko'rinmaydi |
| Nashrga tayyorlik | Serverda holat va metadata tekshiruvlari bor | Nashrdan oldingi kamchiliklar ro'yxati va tegishli bo'limga o'tish | Server cheklovlari saqlanadi; foydalanuvchi kamchilikni qayerda tuzatishni biladi |
| Player va ekspertiza | Oldingi ishda o'qituvchi preview va real holat/tarix ulangan | Namuna bilan tekshirib, zarur format va navigatsiyani kengaytirish | Preview talaba davomati yoki bahosini o'zgartirmaydi |

## Sayt ochilgach tekshiriladigan jarayonlar

1. Ro'yxat ustunlari, filtrlar, kategoriya va ommaviy amallar.
2. Kurs yaratish bosqichlari va majburiy maydonlar.
3. Bo'lim/dars yaratish, tartiblash, media, test va topshiriq imkoniyatlari.
4. Nashr, ekspertiza, arxiv, nusxalash va o'chirishdagi oqibatlar.
5. Talabalarni biriktirish, kirish muddati, narx va hisobotlar.
6. O'qituvchi preview, talaba playeri va kichik ekranlardagi ko'rinish.

Namuna saytda ko'rish va formalarni saqlamasdan o'rganish ustuvor. Kurslar, foydalanuvchilar yoki boshqa real ma'lumotlarni o'zgartirish talab qilinsa, avval aniq maqsad va doira belgilanadi. Natija lokal ScormLms imkoniyatlari bilan taqqoslanib, taklif aniq funksiyalar va sinov mezonlari bilan yangilanadi.

## Tekshirilgan lokal manbalar

- `frontend/src/pages/teacher/courses.tsx`
- `frontend/src/pages/teacher/course-create.tsx`
- `frontend/src/pages/teacher/course-detail.tsx`
- `frontend/src/services/api/teacher-portal-api.ts`
- `src/main/kotlin/uz/scorm/lms/app/v1/courses/service/CourseService.kt`

## Lokal loyihada bajarilgan o'zgarishlar

Foydalanuvchining ishni boshlash topshirig'i asosida, namuna sayt hali ochilmagan holda quyidagilar joriy qilindi:

- Kurslar ro'yxatida barcha/qoralama/nashr/arxiv hisoblari va holat bo'yicha tez filtrlash; kategoriya filtri; kurs, fan, kategoriya va guruh bo'yicha qidirish; nom bo'yicha tartiblash hamda filtrlarni tozalash mavjud.
- Har bir kurs uchun bitta amallar menyusi ma'lumotlar, nusxalash, nashr, qoralamaga qaytarish, arxivlash va o'chirishni ko'rsatadi. Nashrdagi kursni o'chirish bloklangan. Arxivlash/o'chirishdan oldin kurs nomi ko'rsatiladi; bekor qilish API so'rovi yubormaydi. Xato bo'lsa oyna saqlanadi, so'rov davomida takroriy yuborish bloklanadi.
- Kurs bo'limlaridagi nomlar o'zbekchalashtirildi. Topshiriqlar va jadval havolalari `courseId`ni saqlaydi. Shu sahifalarda ro'yxat va hisoblar tanlangan kursga tegishli; yangi topshiriq/mashg'ulot ayni kurs bilan ochiladi. Arxivlangan yoki mavjud bo'lmagan kursga yaratish frontendda bloklanadi; serverning avvalgi tekshiruvlari ham saqlanadi.
- Ro'yxatdagi amallar ustuni gorizontal aylantirishda o'ngda ko'rinib turadi; yordamchi ustunlar ekran kengligiga moslashadi.

Tekshiruv: 9 yangi test va mavjud qo'shni jarayonlar bilan jami 24 frontend testi o'tdi. TypeScript/build va o'zgargan fayllar bo'yicha ESLint o'tdi. Buildda avvalgi MathType eval va katta bundle ogohlantirishlari saqlanadi. Kurs amallari, tasdiqlashni bekor qilish, topshiriq yaratishda kursning avtomatik tanlanishi va 390 px kenglikdagi ro'yxat lokal brauzerda tekshirildi. Real kursni arxivlash/o'chirish yoki topshiriq nashr qilish brauzer sinovida bajarilmadi; mutatsiyalar test maketlari bilan tekshirildi.

Hali bajarilmagan: namuna sayt ichini ko'rish va funksiyalarni to'liq taqqoslash; kurs yaratish/media jarayonini shu namuna asosida qayta ishlash; nashrga tayyorlikning alohida tekshiruv paneli. Sertifikat cheklovi bekor qilinmadi va sayt ma'lumotlariga kirilmadi.
