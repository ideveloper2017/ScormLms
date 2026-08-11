# GitHub Actions CI/CD: Ubuntu, Nginx va tashqi Tomcat

Pipeline `.github/workflows/ci.yml` orqali backend va frontendni tekshiradi. `main` push muvaffaqiyatli tugasa, `.github/workflows/cd.yml` aynan shu CI run yaratgan `ROOT.war` va frontend artifactlarini production VPS'ga yuboradi.

## 1. VPS'ni bir marta tayyorlash

Serverda Java 21, Tomcat 10.1+, Nginx, `curl` va `tar` o'rnatilgan bo'lishi kerak. Quyidagi misollarda SSH foydalanuvchisi `deploy`, Tomcat systemd service'i `tomcat10` deb olingan.

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

```ini
# /etc/systemd/system/tomcat10.service.d/scorm-lms.conf
[Service]
EnvironmentFile=/etc/scorm-lms/scorm-lms.env
```

Environment faylini faqat root o'qiy olishi kerak:

```bash
sudo chown root:root /etc/scorm-lms/scorm-lms.env
sudo chmod 600 /etc/scorm-lms/scorm-lms.env
sudo systemctl daemon-reload
```

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

