# ScormLms backup va avariya tiklash runbooki

## Maqsad va SLO

Ushbu runbook PostgreSQL ma'lumotlari hamda `uploads`, SCORM, assignment va xususiy 559 UAT dalil fayllarini birgalikda saqlash va tekshirilgan yangi muhitga tiklash tartibini belgilaydi.

| Ko'rsatkich | Texnik maqsad | Nazorat |
|---|---:|---|
| RPO | 24 soatdan oshmasin | Har kecha to'liq backup; muvaffaqiyatsizlik navbatchiga yuboriladi |
| RTO | 4 soatdan oshmasin | Har chorak disposable bazaga restore drill; vaqt protokolga yoziladi |
| Retention | 35 kunlik daily, 12 oylik monthly | Backup storage lifecycle qoidasi |
| Off-site | Kamida bitta alohida region/site | Backup nusxasi application server diskida yolg'iz qolmaydi |

RPO/RTO qiymatlari universitetning axborot xavfsizligi va biznes egasi tomonidan tasdiqlanishi kerak. Texnik avtomatizatsiya yuqoridagi boshlang'ich maqsadga sozlangan.

## Backup tarkibi va xavfsizlik

Har backup alohida katalogda atomar yaratiladi. Unda:

- PostgreSQL custom-format `database.dump`;
- to'rtta persistent storage uchun `tar.gz` arxiv;
- DB table/Flyway metadata, storage fayl inventari va SHA-256 qiymatli `manifest.json`;
- manifestning alohida `MANIFEST.sha256` nazorati mavjud.

Backup faqat ilova maintenance/read-only holatida olinadi. Bu DB snapshot va fayllar orasidagi mantiqiy izchillikni ta'minlaydi. `DB_PASSWORD` argument yoki logga yozilmaydi; environment/secret manager orqali uzatiladi. Backup storage server-side encryption, cheklangan service account va immutable/object-lock bilan himoyalanishi lozim.

## Har tungi backup

```powershell
$env:DB_URL = 'jdbc:postgresql://db.internal:5432/scorm_lms'
$env:DB_USERNAME = 'scorm_backup'
$env:DB_PASSWORD = '<secret-managerdan>'
$env:POSTGRES_BIN = '/usr/lib/postgresql/16/bin'
$env:BACKUP_OUTPUT_DIR = '/var/backups/scorm-lms'
$env:FILE_UPLOAD_DIR = '/var/lib/scorm-lms/uploads'
$env:SCORM_STORAGE_DIR = '/var/lib/scorm-lms/scorm'
$env:ASSIGNMENT_STORAGE_DIR = '/var/lib/scorm-lms/assignments'
$env:UAT_PRIVATE_STORAGE_DIR = '/var/lib/scorm-lms/uat-559'
pwsh ./ops/backup/backup-scorm-lms.ps1
```

To'rtta storage katalogi deployment vaqtida oldindan yaratiladi; application user o'z katalogiga yozadi, backup service account esa faqat o'qiydi. UAT hali boshlanmagan bo'lsa ham `UAT_PRIVATE_STORAGE_DIR` bo'sh katalog sifatida mavjud bo'lishi kerak.

Exit code `0` va `.partial` suffixsiz yakuniy katalog backup muvaffaqiyatini bildiradi. Monitoring backup yoshi 24 soatdan oshsa incident ochadi. Retention va off-site copy backup yakunlangandan keyin storage platform lifecycle'i orqali bajariladi.

Linux server uchun `ops/backup/scorm-lms-backup.service` va `scorm-lms-backup.timer` namunasi mavjud. Ularni `/etc/systemd/system`ga o'rnatib, `/etc/scorm-lms/backup.env` faylini faqat `root:scorm-backup` o'qiydigan `0640` ruxsat bilan yarating. So'ng `systemctl enable --now scorm-lms-backup.timer` va `systemctl list-timers scorm-lms-backup.timer` orqali jadvalni tekshiring. Service hardening sabab backup katalogi yozishga, LMS storage esa faqat o'qishga ochiladi.

## Restore tartibi

1. Incident rahbari restore nuqtasini va backup katalogini tasdiqlaydi.
2. SHA-256, `pg_restore --list`, manifest va arxiv yo'llari skript tomonidan tekshiriladi.
3. Restore faqat mavjud bo'lmagan yangi database nomiga va bo'sh storage rootga bajariladi. Manba bazaning ustiga yozish bloklangan.
4. Flyway installed rank, public table soni va barcha storage fayllarining path/size/SHA-256 inventari tekshiriladi.
5. Ilova restore muhitida `postgresql-prod` profil bilan ishga tushiriladi; health, login, kurs, SCORM launch va fayl download smoke-test qilinadi.
6. Biznes egasi tasdiqlagach DNS/load balancer yangi muhitga o'tkaziladi. Eski muhit dalil saqlash muddatigacha read-only qoladi.

```powershell
$env:RESTORE_DB_URL = 'jdbc:postgresql://db.internal:5432/scorm_lms_restore_20260806'
$env:RESTORE_DB_USERNAME = 'scorm_restore'
$env:RESTORE_DB_PASSWORD = '<secret-managerdan>'
pwsh ./ops/backup/restore-scorm-lms.ps1 `
  -BackupDirectory '/var/backups/scorm-lms/scorm-lms-20260806T010000Z-12345678' `
  -TargetStorageRoot '/var/lib/scorm-lms-restore' `
  -ConfirmRestore
```

## Choraklik restore drill

Drill yangi tasodifiy `scorm_lms_restore_drill_*` bazasini yaratadi, backupni tiklaydi va har bir public jadval uchun row count hamda deterministik row fingerprintni manba bilan solishtiradi. To'rt storage inventari, jumladan xususiy UAT dalillari ham tekshiriladi. Disposable baza va vaqtinchalik fayllar yakunda tozalanadi.

```powershell
pwsh ./ops/backup/invoke-restore-drill.ps1 `
  -ReportPath './ops/backup/drill-reports/restore-drill.json'
```

Drill protokolida sana, operator, backup ID, source/target PostgreSQL versiyasi, davomiylik, tekshirilgan jadval/fayl soni, RTO natijasi va aniqlangan muammo bo'lishi kerak. Muvaffaqiyatsiz drill production backupni o'chirishga sabab bo'lmaydi; incident ochilib, tuzatishdan keyin qayta ishlatiladi.

## Rollar

| Rol | Javobgarlik |
|---|---|
| Navbatchi DevOps | Nightly job, alert va off-site nusxani nazorat qiladi |
| DBA | Backup/restore credentiali, restore va DB yaxlitligini boshqaradi |
| Axborot xavfsizligi | Encryption, access log va retentionni audit qiladi |
| LMS biznes egasi | RPO/RTO va tiklangan tizim UAT natijasini tasdiqlaydi |
| Incident rahbari | Cutover/rollback qarorini qayd etadi |

## Incident qaydi

Har haqiqiy restore yoki drill uchun quyidagilar ticket/protokolda saqlanadi: incident ID, sabab, tanlangan backup, kutilgan va haqiqiy RPO/RTO, checksum natijasi, Flyway holati, storage inventari, smoke-test/UAT, cutover va rollback vaqti, mas'ullar hamda imzolar.
