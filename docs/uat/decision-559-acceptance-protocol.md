# 559-son qaror bo'yicha qabul protokoli

> Shablon. Imzolangan hujjatning skan/PDF nusxasi evidence katalogiga joylanib, UAT manifestida qayd etilmaguncha ushbu fayl qabul dalili hisoblanmaydi.

## 1. Protokol rekvizitlari

| Maydon | Qiymat |
|---|---|
| Protokol raqami |  |
| Tashkilot |  |
| Sana va joy |  |
| UAT muhiti/URL |  |
| Backend build/commit |  |
| Frontend build/commit |  |
| DB/Flyway versiyasi |  |
| UAT checklist versiyasi |  |
| V45–V55 evidence-set SHA-256 (imzodan oldingi `evidenceSetSha256`) |  |
| Runtime UAT run ID |  |

## 2. Komissiya tarkibi

| F.I.Sh. | Lavozim/rol | Vakolat | Imzo | Sana |
|---|---|---|---|---|
|  | Komissiya raisi | Yakuniy qabul |  |  |
|  | Ta'lim/metodika vakili | Qaror bandlari va o'quv jarayoni |  |  |
|  | Axborot xavfsizligi vakili | Xavfsizlik, biometrika va audit |  |  |
|  | IT/ekspluatatsiya vakili | Infratuzilma, backup va monitoring |  |  |
|  | Yuridik vakil | Tashqi hujjatlar va maxfiylik |  |  |
|  | Foydalanuvchi vakili | Student/teacher UAT |  |  |

## 3. Tekshiruv natijalari

| Ko'rsatkich | Qiymat |
|---|---|
| Jami UAT ssenariy |  |
| PASS |  |
| FAIL |  |
| BLOCKED |  |
| NOT_APPLICABLE |  |
| Ochiq critical/high issue |  |
| Qabul qilingan qoldiq risklar |  |

## 4. Ochiq nomuvofiqlik va shartlar

| Issue/risk ID | Band | Daraja | Tavsif | Mas'ul | Muddat | Qabul qiluvchi imzo |
|---|---:|---|---|---|---|---|
|  |  |  |  |  |  |  |

## 5. Qaror

Quyidagi variantlardan bittasi belgilanadi:

- [ ] `QABUL QILINDI` - barcha majburiy ssenariylar o'tgan va productionga ruxsat beriladi.
- [ ] `SHARTLI QABUL` - faqat yuqorida yozilgan non-critical shartlar bilan, alohida risk egasi tasdig'ida.
- [ ] `QABUL QILINMADI` - majburiy band yoki release gate bajarilmagan.

Qaror izohi:

................................................................................

Productionga ruxsat sanasi/oynasi: ..............................................

Rollback uchun mas'ul: ..........................................................

## 6. Ilovalar

- To'ldirilgan UAT checklist va issue reestri.
- `decision-559-uat-evidence.json` hamda verifier hisoboti.
- `APPROVED` acceptance bundle ZIPi (legacy final run uchun schema-v2/v3/v4 yoki manual-checklist/protokol bindingli yangi run uchun schema-v5 runtime manifest, private dalillar, imzolangan protokol va `SHA256SUMS`), detached `X-Content-SHA256` sidecar fayli hamda bundle verifier hisoboti.
- Backend/frontend regressiya natijalari.
- Dependency/security audit va qoldiq risk qarorlari.
- Backup/restore drill hamda performance baseline.
- O'zDSt, litsenziya, infratuzilma, biometrik siyosat va integratsiya kabi tashqi dalillar.
- Imzolangan ushbu protokolning o'zgarmas PDF/skan nusxasi va SHA-256 qiymati.

> Eslatma: protokol ichida imzodan oldingi dalillar to'plamining `evidenceSetSha256` qiymati qayd etiladi. Protokol yuklanib, run tasdiqlangandan keyin hosil bo'lgan yakuniy runtime manifest SHA-256 qiymati circular bog'lanish yaratmasligi uchun protokol ichiga emas, alohida sidecar va verifier hisobotiga yoziladi.

> V49 amaliy tartibi: barcha 27 band final natija va boshqa foydalanuvchining `ACCEPTED` reviewiga yetgach runtime panelidagi `Imzolash uchun loyiha` olinadi. Server run ID, qaror SHA, schema, canonical evidence-set SHA va 27 band natijalarini oldindan joylagan HTMLni PDFga chop eting; rekvizitlarni to'ldirib komissiya imzolagach aynan shu PDFni runtimega yuklang. Dalil o'zgarsa loyihani qayta oling va qayta imzolang.

> V50 tayyorgarlik tartibi: runtime panelidan `14 band manual dalil paketi`ni oling va 43 topshiriqni ko'rsatilgan mas'ullarga bering. Qaytgan asl hujjat yoki tekshiriladigan rekvizitlar tegishli bandga private fayl sifatida yuklanib, boshqa vakolatli foydalanuvchi tomonidan review qilinadi.

> V51 qabul tartibi: partial bandni `MANUAL_PASS` qilishda faqat real fayl bilan tasdiqlangan checklistlarni belgilang; server shu banddagi barcha topshiriq qoplanmaguncha saqlashni, reviewer esa qabulni bloklaydi. Qoplangan matnlar schema-v5 manifest va imzolanadigan evidence-set SHAga bog'lanadi.

> V52 yig'ish tartibi: hujjatlar qismlarga bo'lib qaytsa bandni `PARTIAL` yoki `BLOCKED_EXTERNAL` qoldirib, aynan qaytgan checklistlar va fayllarni saqlang. `Manual yig'ildi 43/43` bo'lgach bandlarni `MANUAL_PASS`ga o'tkazing; faqat shundan keyin boshqa vakolatli reviewer final qabul qiladi.

> V53 nazorat tartibi: running 43 qatorli manual monitoring reyestrida `PENDING` topshiriqlarni mas'ul va blocker bo'yicha kuzating. Har yig'ilish yakunida SHA-256 sarlavhali CSVni arxivlang; protokol faqat reyestr `43/43 ACCEPTED` bo'lganda imzolanishi kerak.

> V54 koordinatsiya tartibi: har `PENDING` qatorga mas'ul va muddat biriktiring, kechikkanlarni komissiya yig'ilishida ko'rib chiqing. Koordinatsiya yozuvi qabul dalili emas; protokolga faqat fayl bilan qoplangan va mustaqil review qilingan `ACCEPTED` holatlar kiradi.

> V55 ommaviy taqsimlash tartibi: maxsus individual mas'ullarni avval saqlang, keyin qolgan tayinlanmagan qatorlarni tavsiya etilgan bo'limlarga umumiy muddat bilan taqsimlang. `43/43 coordinated` operatsion tayyorgarlikni bildiradi, lekin `43/43 ACCEPTED` o'rnini bosmaydi.
