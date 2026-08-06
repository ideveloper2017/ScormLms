# 559-son qarorga moslashtirish matritsasi

Manba: O'zbekiston Respublikasi Vazirlar Mahkamasining 2022-yil 3-oktabrdagi 559-son qarori va unga ilova qilingan "Oliy ta'lim tashkilotlarida masofaviy ta'limni tashkil etish tartibi to'g'risida"gi nizom.

Manba PDF: `559-son qaror.pdf`, 10 sahifa, SHA-256 `A1E6CF0E05640B962550A7B9B95851404F7B50DF590BBA943846E1CEA5FCC2D3`.

Holat belgilari:

- `BAJARILDI` - kod va avtomatik dalil mavjud;
- `QISMAN` - talabning bir qismi ishlaydi, lekin to'liq qabul qilib bo'lmaydi;
- `TASHQI DALIL` - tashkilot, vazirlik yoki yuridik hujjat talab qilinadi;
- `REJADA` - tizim funksiyasi hali tugallanmagan.

## Bandlar bo'yicha amaldagi holat

| Band | Qarordagi talabning texnik mazmuni | Holat | Amaldagi dalil | Qolgan ish |
|---:|---|---|---|---|
| 8 | LMS, Internet infratuzilmasi, yillik kontent, elektron majmualar, server, malakali texnik xodim va rasmiy veb-sahifa | QISMAN | LMS, kurs/kontent moduli, V17 kontent provenance/versiya/validity tarixi, backup/restore va production runbook mavjud | Server mulki yoki kamida 5 yillik ijara, shtat va rasmiy veb-sahifa hujjatlarini komissiya tekshiradi; yillik kontent to'liqligi nazorati `CONT-04`da tugatiladi |
| 9 | O'zDSt 36.2030 talablariga muvofiq elektron resurslar | TASHQI DALIL | Har resursning muallif, til, versiya, manba va validity metadata/revision tarixi mavjud; V18da ownerdan mustaqil ekspert aniq revisionni tasdiqlamaguncha publish bloklanadi | Rasmiy standart/checklist va sertifikat/hujjat reestri kerak (`DEP-03`, `CONT-03`) |
| 10 | LMS SCORM standartlariga mos va avtoproktoring tizimiga ega bo'lishi | QISMAN | SCORM 1.2/2004 import/runtime E2E testlari o'tgan; V13 identity/active-movement preflight attemptga bir martalik bog'lanadi; V14 eventlarni jurnallaydi; V15 aniq proktor scope'i va dalillar panelini beradi; V16 10 kunlik student appeal hamda o'zgarmas manual review qarorini saqlaydi | Universitet tasdiqlagan biometrik rozilik/retention siyosati va vendor/model bahosi tugatiladi (`PROC-04`) |
| 11 | Axborot-resurs, boshqaruv, davomat/o'zlashtirish, kommunikatsiya, kontingent, kurs, o'qitish, statistika va bilim nazorati komponentlari | QISMAN | Auth/RBAC/audit, kurs/kontent, davomat, topshiriq, quiz, jadval, imtihon, attestatsiya, survey va hisobot ishlaydi | Forum, chat, xabar/email/push va provayder videokonferensiyasi tugatiladi (`COMM-01..04`) |
| 12 | Qabul, ko'chirish, qayta tiklash va chetlashtirish umumiy qonuniy tartibda yuritilishi | TASHQI DALIL | Student status va kontingent reestri mavjud | Tasdiqlangan reglament bo'yicha manual UAT va zarur lifecycle integratsiyasi |
| 13 | Masofaviy ta'lim faqat to'lov-kontrakt asosida | BAJARILDI | `StudentServiceDecision559Test` kontraktsiz masofaviy talabani bloklaydi | UATda real kontrakt rekviziti bilan tekshirish |
| 14 | Masofaviy shakl mumkin bo'lmagan yo'nalishlar ro'yxatini hisobga olish | TASHQI DALIL | Masofaviy dastur/litsenziya metadata mavjud | Vazirlikning amaldagi rasmiy ro'yxati va yangilash jarayoni kerak |
| 15 | Qabul parametrlari va kontrakt qiymati vakolatli organ tomonidan tasdiqlanishi | TASHQI DALIL | Qabul limiti va student kontrakt rekvizitlari mavjud | Tasdiqlovchi qaror/protokol va real qiymatlarni komissiya tekshiradi |
| 16 | Nodavlat tashkilotlar tasdiqlangan litsenziya doirasida qabul qilishi | TASHQI DALIL | Masofaviy dastur uchun litsenziya raqami va sanasi majburiy | Litsenziyaning haqiqiyligi va yo'nalish qamrovi manual tekshiriladi |
| 17 | O'qish davomiyligi kunduzgi shakldan kam bo'lmasligi | REJADA | Dastur darajasi saqlanadi | Kunduzgi normativ davomiylik va masofaviy davomiylik maydonlari hamda bloklovchi qoida qo'shiladi |
| 18 | Kontent tili talaba tili va ta'lim dasturiga mos bo'lishi | BAJARILDI | Talaba qabulida til mosligi serverda tekshiriladi va test bilan yopilgan | Kontentning har bir versiyasi bo'yicha publish-time til/dastur nazorati `CONT-05`da kuchaytiriladi |
| 19 | O'quv reja va dasturlar davlat yoki kasbiy standart/malaka talablariga asoslanishi | TASHQI DALIL | Program, subject, individual reja va kurs bog'lanishi mavjud | Standart rekviziti, tasdiqlovchi hujjat va curriculum versiyasi reestri kerak |
| 20 | Bakalavriat 300, magistratura 30; IT istisno; xorijiy talabalar hisobdan tashqari | BAJARILDI | 300/30 chegara, IT va xorijiy talaba istisnolari avtomatik testlarda o'tgan | UAT dataset bilan chegara qiymatlarini ko'rsatish |
| 21 | O'qish boshida LMS bilan tanishtirish; har semestr yakuniy nazorat va davlat attestatsiyasi shaxsan | QISMAN | Muzlatilgan roster, auditoriya davomati, yakuniy nazorat, attestatsiya, DAK protokoli va sertifikat oqimlari mavjud | Dastlabki shaxsan orientatsiya hodisasi va tasdiq jurnali qo'shiladi |
| 22 | Ishlaydigan talaba uchun yakuniy nazorat/attestatsiyaga kamida 15 kunlik ta'til | TASHQI DALIL | Imtihon jadvali mavjud | Ish beruvchi va universitet jarayoni bo'yicha manual UAT/dalil |
| 23 | Amaliyot belgilangan muddat va shartlarda o'tkazilishi | TASHQI DALIL | Kurs va jadval modullari mavjud | Amaliyot placement/lifecycle yoki tashqi tizim dalili aniqlanadi |
| 24 | Barcha dars, amaliyot, mustaqil ish, baholash va nazorat LMSda yuritilishi | QISMAN | Kurs/kontent, live/async session, assignment, quiz, SCORM, exam va progress auditi mavjud | Har fan bo'yicha yillik kontent va faoliyat to'liqligi gate'i (`CONT-04`) |
| 25 | Xorijiy pedagoglarni jalb qilish mumkin | TASHQI DALIL | Teacher reestri mavjud | Zarur bo'lsa mehnat/hamkorlik hujjatlari bilan manual UAT |
| 26 | Bir o'qituvchiga to'g'ri keladigan talabalar 1:50 dan oshmasligi | BAJARILDI | Qabulda bloklovchi qoida va real compliance metrikasi testlangan | UAT dataset bilan 50/51 chegara ssenariysi |
| 27 | Reja/dasturlarni to'liq o'zlashtirgan va attestatsiyadan o'tgan bitiruvchiga hujjat berilishi | QISMAN | Attestatsiya completion gate, tasdiqlangan DAK protokoli va tekshiriladigan sertifikat mavjud | Davlat namunasidagi diplom tizimi/registri bilan rasmiy bog'lanish va manual tekshiruv |
| 28 | Ta'lim jarayonini vazirlik va inspeksiya monitoring qilishi | QISMAN | Compliance, hisobot, audit, survey va monitoring roli mavjud | Tashqi vakolatli organ kirishi va foydalanish reglamenti tasdiqlanadi |
| 29 | LMSni vazirlik va ta'lim sifati yagona ma'lumotlar tizimiga integratsiya qilish | TASHQI DALIL | HEMIS login/importning bir qismi mavjud; yo'q integratsiyalar compliance'da yashirilmaydi | Rasmiy API, test muhiti va credential talab qilinadi (`DEP-01/02`, `INT-01..05`) |
| 30 | Kuzatuv/tahlil, so'rov, fokus-guruh, intervyu, anketalar orqali monitoring | QISMAN | Anonim student/teacher survey, privacy threshold va agregat tahlil mavjud | Fokus-guruh/intervyu protokoli va kuzatuv dalillarini birlashtirish |
| 31 | Monitoringda topilgan kamchiliklarni bartaraf etish | BAJARILDI | Mas'ul, deadline, reja, yechim dalili va real qayta hisobga bog'langan issue lifecycle ishlaydi | UATda ochish-yopish va overdue ssenariysi ko'rsatiladi |
| 32 | O'quv-metodik jarayon bo'yicha shikoyat qilish imkoniyati | QISMAN | Imtihon apellyatsiyasi mavjud | Umumiy murojaat/ticket va SLA oqimi (`COMM-05`) |
| 33 | Talab buzilganda qonuniy javobgarlik | TASHQI DALIL | Audit trail va eksport mavjud | Ichki reglament, mas'ullar va yuridik tasdiq |

## Productionning texnik darvozalari

- `SPRING_PROFILES_ACTIVE=postgresql-prod`, real `DB_*`, tasodifiy kamida 64 baytli `JWT_SECRET` va aniq HTTPS `CORS_ALLOWED_ORIGINS` beriladi.
- `SCORM_SECURE_COOKIE=true`; SCORM kontenti asosiy frontend originidan ajratiladi.
- Persistent `FILE_UPLOAD_DIR`, `SCORM_STORAGE_DIR`, `ASSIGNMENT_STORAGE_DIR` backup manifestiga kiradi.
- Release oldidan backend/frontend regressiya, dependency audit, restore drill va HTTP baseline takrorlanadi.
- Yakuniy `MON-07` faqat UAT manifestidagi barcha bandlar `AUTOMATED_PASS`, `MANUAL_PASS` yoki asoslangan `NOT_APPLICABLE` bo'lganda va protokol imzolanganda yopiladi.
