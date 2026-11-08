# GitHub Actions CI/CD: Ubuntu, Nginx va tashqi Tomcat

Pipeline `.github/workflows/ci.yml` orqali backend va frontendni tekshiradi. `main` push muvaffaqiyatli tugasa, `.github/workflows/cd.yml` aynan shu CI run yaratgan `ROOT.war` va frontend artifactlarini production VPS'ga yuboradi.

Pipeline qat'iy ketma-ket ishlaydi:

1. Backend test qilinadi va `ROOT.war` build qilinadi.
2. Faqat backend muvaffaqiyatli tugagach frontend lint, test va build ishlaydi.
3. Faqat butun CI muvaffaqiyatli tugagach CD production deployni boshlaydi.
4. Bir vaqtda faqat bitta production deploy ishlaydi; keyingi deploy navbatda kutadi.

## 1. VPS'ni bir marta tayyorlash

Serverda Java 21, Tomcat 11.0+, Nginx, `curl`, `tar` va PostgreSQL client
utilitalari (`psql`, `createdb`) o'rnatilgan bo'lishi kerak. Quyidagi misollarda
SSH foydalanuvchisi `deploy`, Tomcat systemd service'i `tomcat11` deb olingan.

```bash
sudo useradd --create-home --shell /bin/bash deploy
sudo install -d -o deploy -g deploy -m 700 /var/tmp/scorm-lms/incoming
sudo install -d -o root -g root -m 755 /etc/scorm-lms /var/www/scorm-lms/releases
sudo install -d -o root -g root -m 700 /var/backups/scorm-lms/deployments

sudo install -o root -g root -m 0755 ops/deploy/scorm-lms-deploy /usr/local/sbin/scorm-lms-deploy
sudo install -o root -g root -m 0644 ops/deploy/deploy.conf.example /etc/scorm-lms/deploy.conf
sudo install -o root -g root -m 0440 ops/deploy/scorm-lms-deploy.sudoers.example /etc/sudoers.d/scorm-lms-deploy
sudo visudo -cf /etc/sudoers.d/scorm-lms-deploy
```

### Eng kam sozlash: env fayl va deploy.conf shart emas

`/etc/scorm-lms/scorm-lms.env` ham, `/etc/scorm-lms/deploy.conf` ham ixtiyoriy. WAR Tomcat'da profil berilmagan bo'lsa `postgresql-prod` ni o'zi tanlaydi, barcha sozlamalarning standarti bor, jadvallarni Flyway ilova ishga tushganda o'zi yaratadi. Serverda faqat bir marta PostgreSQL rol va bazani yarating:

```bash
sudo -u postgres psql -c "CREATE ROLE scorm_lms LOGIN PASSWORD 'scorm-lms-default-db-password'"
sudo -u postgres createdb --owner scorm_lms scorm_lms
```

| Sozlama | Env'siz standart | Almashtirish |
| --- | --- | --- |
| Baza | `jdbc:postgresql://localhost:5432/scorm_lms`, rol `scorm_lms` | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` |
| JWT siri | har ishga tushganda tasodifiy (qayta ishga tushganda hamma qayta kiradi) | `JWT_SECRET` |
| Anonim so'rovnoma siri | baza parolidan olinadi (qayta ishga tushganda o'zgarmaydi) | `SURVEY_ANONYMIZATION_SECRET` |
| CORS | `http://localhost`; nginx namunasida frontend va `/api` bitta domen, CORS ishlamaydi | `CORS_ALLOWED_ORIGINS` |
| Fayllar | Tomcat katalogidagi `scorm-lms-data/` | `APP_DATA_DIR` yoki alohida `*_DIR` |
| Log | Tomcat `logs/scorm-lms.log` | `LOG_FILE` |
| Birinchi administrator | login `admin`, parol tasodifiy: logda `BIRINCHI ADMINISTRATOR` qatori | `APP_SEED_ADMIN_PASSWORD` |

Standart baza paroli repozitoriyda ochiq. Uni faqat serverning o'zidagi (localhost) baza uchun qoldiring; xohlasangiz `ALTER ROLE scorm_lms PASSWORD '...'` qilib, shu parolni `DB_PASSWORD` sifatida bering. Birinchi administrator parolini logdan oling va kirgach almashtiring:

```bash
sudo grep -h "BIRINCHI ADMINISTRATOR" /var/lib/tomcat11/logs/scorm-lms.log
```

Standartlarni almashtirish kerak bo'lsa (ixtiyoriy), `/etc/scorm-lms/deploy.conf` ichida Tomcat service nomi va `webapps` manzilini real serverga moslang, qolgan qiymatlarni esa repodan tashqaridagi `/etc/scorm-lms/scorm-lms.env` faylidan bering:

Env fayl mavjud bo'lsa, deploy preflight `APP_ENV_FILE` ichidagi `DB_URL` database nomini
`EXPECTED_DATABASE_NAME` bilan solishtiradi. Bu LMS'ni tasodifan `qms_queue`
yoki boshqa tizim bazasiga ulashni bloklaydi. Lokal PostgreSQL ishlatilganda
`AUTO_CREATE_DATABASE=true` bo'lsa, database yo'q paytda deploy uni mavjud
`DB_USERNAME` roli egasida avtomatik yaratadi; jadvallarni keyin Flyway
yaratadi. Preflight ilova credentiali bilan ulanishni, `public` schema uchun
`USAGE/CREATE` huquqini, muvaffaqiyatsiz Flyway history yozuvlarini va joriy
versiyani ham tekshiradi. Login roli xavfsizlik sabab avtomatik yaratilmaydi va
bir marta qo'lda tayyorlanadi:

```bash
sudo -u postgres createuser --pwprompt scorm_lms
```

Rol avvaldan mavjud bo'lsa bu buyruq kerak emas. Remote PostgreSQL uchun
database provider/server tomonida yaratiladi va `AUTO_CREATE_DATABASE=false`
qoldiriladi.

```ini
# /etc/systemd/system/tomcat11.service.d/scorm-lms.conf
[Service]
EnvironmentFile=/etc/scorm-lms/scorm-lms.env
```

Environment faylini faqat root o'qiy olishi kerak:

```bash
sudo chown root:root /etc/scorm-lms/scorm-lms.env
sudo chmod 600 /etc/scorm-lms/scorm-lms.env
sudo systemctl daemon-reload
```

### aaPanel Tomcat

aaPanel serverning o'zida Gradle yoki npm build bajarmaydi. GitHub-hosted runner
tayyor `ROOT.war` va frontend artifactini yaratadi, CD esa ularni serverga
o'rnatadi. aaPanel Java Manager o'rnatgan Tomcat katalogini aniqlang:

```bash
sudo find /www/server -maxdepth 3 -type d -path '*/webapps'
sudo systemctl list-unit-files | grep -i tomcat
```

Topilgan qiymatlarni `/etc/scorm-lms/deploy.conf` ga yozing. Masalan:

```ini
TOMCAT_WEBAPPS_DIR=/www/server/tomcat11/webapps
TOMCAT_SERVICE=tomcat11
```

Spring Boot 4 uchun Tomcat 11 va Java 21 ishlating. Tomcat service aaPanel orqali
o'rnatilgan bo'lsa ham production environment systemd override orqali beriladi:

```bash
sudo systemctl edit tomcat11
```

```ini
[Service]
EnvironmentFile=/etc/scorm-lms/scorm-lms.env
```

So'ng konfiguratsiyani qo'llang va environment fayli ulanganini tekshiring:

```bash
sudo systemctl daemon-reload
sudo systemctl restart tomcat11
sudo systemctl show tomcat11 --property=EnvironmentFiles
```

Env fayl mavjud bo'lsa, preflight undagi `SPRING_PROFILES_ACTIVE` `postgresql-prod` ni o'z ichiga
olishini tekshiradi (profil umuman berilmasa WAR o'zi `postgresql-prod` ni tanlaydi) va Tomcat
service faylni yuklamayotgan bo'lsa ogohlantiradi. Shu orqali Flyway tasodifan dev profil yoki
boshqa database bilan ishga tushishi bloklanadi. Env fayl bo'lmasa bu tekshiruvlar o'tkazib yuboriladi.

Nginx misolini o'rnating, `server_name`ni almashtiring va TLS'ni Certbot yoki mavjud sertifikat bilan yoqing:

```bash
sudo cp ops/deploy/nginx-scorm-lms.conf.example /etc/nginx/sites-available/scorm-lms
sudo ln -s /etc/nginx/sites-available/scorm-lms /etc/nginx/sites-enabled/scorm-lms
sudo nginx -t
sudo systemctl reload nginx
```

Deploy foydalanuvchisining public SSH kalitini `/home/deploy/.ssh/authorized_keys`ga qo'ying. U database yoki ilova secretlarini o'qishi shart emas.

## 2. GitHub Repository Variables

Repository `Settings -> Secrets and variables -> Actions -> Variables` bo'limida:

- `VITE_API_BASE_URL`, masalan `https://lms.example.uz/api/v1`
- `VITE_WS_URL`, masalan `wss://lms.example.uz/ws`
- `VITE_SCORM_CONTENT_ORIGIN`, SCORM uchun ajratilgan HTTPS origin

Bu qiymatlar frontend JavaScript ichiga build qilinadi, shuning uchun ular secret emas.

## 3. GitHub production Environment Secrets

`Settings -> Environments -> production` yarating. Imkon bo'lsa required reviewer qo'ying. Secrets:

- `DEPLOY_HOST` — VPS host yoki IP
- `DEPLOY_USER` — odatda `deploy`
- `DEPLOY_PORT` — odatda `22`; bo'sh qoldirilsa ham 22 ishlatiladi
- `DEPLOY_SSH_KEY` — deploy private key
- `DEPLOY_KNOWN_HOSTS` — VPS host key qatori

`DEPLOY_KNOWN_HOSTS`ni VPS fingerprintini alohida kanal orqali tekshirgandan keyin oling:

```bash
ssh-keyscan -H -p 22 lms.example.uz
```

## 4. Production environment

Env fayl ixtiyoriy. Yaratsangiz, faqat standartni almashtirmoqchi bo'lgan qiymatlarni yozing (README'dagi production ro'yxati): `DB_*`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, persistent storage kataloglari. Yozilgan secretlar namuna yoki zaif bo'lmasligi preflight'da tekshiriladi. Haqiqiy secretlarni Git'ga commit qilmang.

Flyway uchun quyidagi qiymatlarni ham aniq saqlang:

```ini
DB_SCHEMA=public
FLYWAY_BASELINE_ON_MIGRATE=true
FLYWAY_BASELINE_VERSION=0
FLYWAY_CONNECT_RETRIES=10
FLYWAY_CONNECT_RETRIES_INTERVAL=5s
FLYWAY_LOCK_RETRY_COUNT=120
```

`baseline-on-migrate` faqat Flyway history'siz legacy LMS schema uchun ishlaydi.
History mavjud bazada uning versiyasi/checksumini qo'lda o'zgartirmang va eski
`V*.sql` fayllarni tahrirlamang. Deploy muvaffaqiyatsiz bo'lsa deploy chiqishiga
Tomcat jurnalining oxirgi 150 qatori avtomatik qo'shiladi; unda Flyway xatosining
aniq migration nomi va PostgreSQL sababi ko'rinadi. Serverda qo'lda ko'rish:

```bash
sudo journalctl -u tomcat11 -n 200 --no-pager | grep -Ei 'flyway|migration|sql state|caused by|error'
```

Tomcat foydalanuvchisiga persistent kataloglarga yozish huquqi bering. PostgreSQL va storage backup ishlayotganini tekshirmasdan birinchi production deployni boshlamang. Flyway migratsiyasi ishga tushgandan keyin faqat eski WAR'ni qaytarish database sxemasini ortga qaytarmaydi.

## 5. Birinchi deploy

Avval GitHub'dagi `CI` workflow'ni qo'lda ishga tushirib tekshiring. Keyin `main`ga push qiling. `CI` muvaffaqiyatli tugagach `CD` production Environment approvalini kutadi va deploy qiladi.

Deploy davomida:

1. Artifact checksum tekshiriladi.
2. Frontend yangi release katalogiga ochilib, `current` symlinki atomar almashtiriladi.
3. Oldingi `ROOT.war` backup qilinadi.
4. Tomcat to'xtatilib, yangi WAR o'rnatiladi va qayta ishga tushiriladi.
5. Readiness 5 daqiqagacha tekshiriladi; muvaffaqiyatsiz bo'lsa frontend symlinki va WAR avtomatik qaytariladi.
