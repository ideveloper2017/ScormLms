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

`/etc/scorm-lms/deploy.conf` ichida Tomcat service nomi va `webapps` manzilini real serverga moslang. Tomcat production environment qiymatlarini repodan tashqaridagi `/etc/scorm-lms/scorm-lms.env` faylidan olishi tavsiya etiladi:

Deploy preflight `APP_ENV_FILE` ichidagi `DB_URL` database nomini
`EXPECTED_DATABASE_NAME` bilan solishtiradi. Bu LMS'ni tasodifan `qms_queue`
yoki boshqa tizim bazasiga ulashni bloklaydi. Lokal PostgreSQL ishlatilganda
`AUTO_CREATE_DATABASE=true` bo'lsa, database yo'q paytda deploy uni mavjud
`DB_USERNAME` roli egasida avtomatik yaratadi; jadvallarni keyin Flyway
yaratadi. Login roli xavfsizlik sabab avtomatik yaratilmaydi va bir marta
qo'lda tayyorlanadi:

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

Deploy preflight `SPRING_PROFILES_ACTIVE` ichida `postgresql-prod` borligini va
Tomcat service aynan `APP_ENV_FILE` faylini yuklayotganini tekshiradi. Shu orqali
Flyway tasodifan dev profil yoki boshqa database bilan ishga tushishi bloklanadi.

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

`/etc/scorm-lms/scorm-lms.env` kamida README'dagi production qiymatlarini saqlashi kerak: `SPRING_PROFILES_ACTIVE`, database credentiallari, `JWT_SECRET`, aniq `CORS_ALLOWED_ORIGINS` va persistent storage kataloglari. Haqiqiy secretlarni Git'ga commit qilmang.

Tomcat foydalanuvchisiga persistent kataloglarga yozish huquqi bering. PostgreSQL va storage backup ishlayotganini tekshirmasdan birinchi production deployni boshlamang. Flyway migratsiyasi ishga tushgandan keyin faqat eski WAR'ni qaytarish database sxemasini ortga qaytarmaydi.

## 5. Birinchi deploy

Avval GitHub'dagi `CI` workflow'ni qo'lda ishga tushirib tekshiring. Keyin `main`ga push qiling. `CI` muvaffaqiyatli tugagach `CD` production Environment approvalini kutadi va deploy qiladi.

Deploy davomida:

1. Artifact checksum tekshiriladi.
2. Frontend yangi release katalogiga ochilib, `current` symlinki atomar almashtiriladi.
3. Oldingi `ROOT.war` backup qilinadi.
4. Tomcat to'xtatilib, yangi WAR o'rnatiladi va qayta ishga tushiriladi.
5. Readiness 5 daqiqagacha tekshiriladi; muvaffaqiyatsiz bo'lsa frontend symlinki va WAR avtomatik qaytariladi.
