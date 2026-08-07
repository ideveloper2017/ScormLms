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
| V45–V49 evidence-set SHA-256 (imzodan oldingi `evidenceSetSha256`) |  |
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
- `APPROVED` acceptance bundle ZIPi (legacy run uchun schema-v2/v3 yoki protokol-evidence bindingli yangi run uchun schema-v4 runtime manifest, private dalillar, imzolangan protokol va `SHA256SUMS`), detached `X-Content-SHA256` sidecar fayli hamda bundle verifier hisoboti.
- Backend/frontend regressiya natijalari.
- Dependency/security audit va qoldiq risk qarorlari.
- Backup/restore drill hamda performance baseline.
- O'zDSt, litsenziya, infratuzilma, biometrik siyosat va integratsiya kabi tashqi dalillar.
- Imzolangan ushbu protokolning o'zgarmas PDF/skan nusxasi va SHA-256 qiymati.

> Eslatma: protokol ichida imzodan oldingi dalillar to'plamining `evidenceSetSha256` qiymati qayd etiladi. Protokol yuklanib, run tasdiqlangandan keyin hosil bo'lgan yakuniy runtime manifest SHA-256 qiymati circular bog'lanish yaratmasligi uchun protokol ichiga emas, alohida sidecar va verifier hisobotiga yoziladi.

> V49 amaliy tartibi: barcha 27 band final natija va boshqa foydalanuvchining `ACCEPTED` reviewiga yetgach runtime panelidagi `Imzolash uchun loyiha` olinadi. Server run ID, qaror SHA, schema, canonical evidence-set SHA va 27 band natijalarini oldindan joylagan HTMLni PDFga chop eting; rekvizitlarni to'ldirib komissiya imzolagach aynan shu PDFni runtimega yuklang. Dalil o'zgarsa loyihani qayta oling va qayta imzolang.
