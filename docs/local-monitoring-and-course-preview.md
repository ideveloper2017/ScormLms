# Lokal server: kurs ko'rinishi va proktoring

2026-09-14 holati. Ushbu ish 559-son qarorga to'liq muvofiqlik sertifikati emas. Amaldagi norma va tarixiy PDF o'rtasidagi farq `decision-559-alignment.md`da qayd etilgan.

## Ishlaydigan qismlar

- O'qituvchi kursidagi vertikal menyu kesilmaydi. Kurs ko'rinishi va player darslarni modul/tartib bo'yicha ochadi, oldingi/keyingi darsga o'tadi. Bu o'qituvchi preview rejimi: qoralamalar ko'rinadi, talaba davomati va bahosi yozilmaydi.
- Tasdiqlash holati har bir darsning serverdan olingan ekspertiza/nashr holatini va mavjud ekspertiza tarixini ko'rsatadi.
- Serverga yuklangan video autentifikatsiyali fayl endpointi orqali ochiladi. Preview videoni to'liq Blob sifatida yuklaydi; katta video uchun segmentli uzatish yoki HTTP Range optimallashtirishi hali yo'q.
- Qo'shimcha audio/yuz monitoringi brauzerda ishlaydi. Modellar shu frontendning `/models` katalogidan olinadi; ushbu monitoring xom audio yoki videoni saqlamaydi va tashqi AI xizmatiga yubormaydi. LMSga hodisa turi, vaqt va UUID jo'natiladi. Avvalgi yuz orqali shaxsni tekshirish va uning rozilik/saqlash tartibi alohida qoladi.
- Tovush energiyasi, yuz yo'qligi, bir nechta yuz va boshning yon tomonga burilish signallari proktor jurnaliga tushadi. Ular avtomatik baho yoki qoidabuzarlik hukmini bermaydi. Bosh holati aniq ko'z nigohini kuzatish emas; tovush energiyasi nutq mazmuni yoki boshqa odam ovozini aniqlamaydi.

## Yoqish tartibi

1. Backendga V75 migratsiyasi qo'llanadi. Eski biometrik siyosatlar uchun `localMonitoringEnabled=false`; mavjud rozilik hashlarining qiymati saqlanadi.
2. Vakolatli administrator yangi siyosat loyihasida lokal audio/yuz monitoringini tanlaydi va tegishli maqsad, muddat hamda hujjatlarni kiritadi. Mavjud mustaqil tasdiqlash jarayoni orqali boshqa vakolatli shaxs siyosatni nashr qiladi.
3. Talaba yangi siyosatga rozilik beradi. Server sensor hodisalarini faqat faol rozilik, ayni siyosat/rozilikka bog'langan proktoring sessiyasi va yoqilgan monitoring uchun qabul qiladi. Siyosat almashganda avvalgi sessiyadagi sensor hodisalari qabul qilinmaydi.
4. Brauzer kamera/mikrofon ruxsatlarini foydalanuvchidan so'raydi. Mikrofon dastlab taxminan 10 soniya fon tovushini o'lchaydi. Qurilma yoki model xatosi sahifada ko'rinadi; qayta yoqish tugmasi mavjud. Sahifa yopilishi yoki rozilik tekshiruvi monitoringni o'chirganda oqimlar to'xtaydi.

`localhost` ishlab chiqish uchun ishlaydi. Talabalar lokal tarmoqdagi boshqa qurilmalardan kiradigan joylashtirishda ishonchli HTTPS domeni, doimiy fayl saqlash, baza/fayl backupi va tarmoq quvvati tayyorlanishi kerak. Oddiy HTTP IP-manzilida kamera/mikrofon brauzer tomonidan cheklanishi mumkin.

## Hali talab qilinadigan ish

- Jonli videokonferensiya media serveri ushbu o'zgarishda o'rnatilmadi. LMS dars jadvali va havolalarni yuritadi; jonli dars uchun tashkilotning serverida alohida konferensiya xizmati va tarmoq sozlamalari kerak.
- Davlat axborot tizimlari bilan haqiqiy almashinuv rasmiy API va ruxsatlarsiz amalga oshmaydi. Lokal server bu integratsiyalarni almashtirmaydi.
- Turli kamera, yorug'lik, ko'zoynak, fon tovushi va sust qurilmalarda inson nazorati bilan sinov kerak. Sensor chegaralari boshlang'ich evristika; ularning aniqligi yoki barcha foydalanuvchilar uchun teng ishlashi tasdiqlanmagan.
- 559-son bo'yicha tashkilot hujjatlari, amaliy infratuzilma dalillari va vakolatli UAT qabuli alohida bajariladi. Tarixiy UAT katalogidagi holatlar bu o'zgarish sabab avtomatik PASSga aylantirilmagan.

## Tekshiruv

Backendning rozilik, ruxsatlar, proktor ko'rinishi, hodisa chegaralari, V75 migratsiyasi va 559 qoidalariga tegishli 22 testi alohida vaqtinchalik PostgreSQL bazasida o'tdi. Frontendda player navigatsiyasi, sensor signal algoritmi va cleanup, rozilik hamda test sessiyasini tiklash bo'yicha 19 test o'tdi. Brauzerda kurs ko'rinishi, playerda oldingi/keyingi dars va ekspertiza tarixi ochilishi tekshirildi. Lokal backend UP, V75 migratsiyasi bazada muvaffaqiyatli qo'llangan. Haqiqiy foydalanuvchining kamera/mikrofoni bilan yozuv yoki biometrik sinov o'tkazilmadi.
