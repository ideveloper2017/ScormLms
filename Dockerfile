# syntax=docker/dockerfile:1
# ScormLms backend (faqat Spring Boot ilova). Frontend (nginx) va PostgreSQL Docker'dan tashqarida, hostda.
# Ishga tushirish: docker compose up -d --build   (docker-compose.yml ga qarang)

# ---------- 1) Build: build/libs/ROOT.war ----------
FROM eclipse-temurin:21-jdk-noble AS build
WORKDIR /src
COPY gradlew settings.gradle build.gradle gradle.properties ./
COPY gradle ./gradle
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew
COPY docs/uat/decision-559-uat-evidence.json ./docs/uat/
COPY src/main ./src/main
# Gradle keshi buildlar orasida saqlanadi (kutubxonalar har safar qayta yuklanmaydi).
# Xotira kichik serverda ham yig'ilishi uchun gradle.properties dagi 4g/3g o'rniga 2g, Kotlin alohida daemonsiz.
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon \
      "-Dorg.gradle.jvmargs=-Xmx2g -Dfile.encoding=UTF-8" \
      -Pkotlin.compiler.execution.strategy=in-process \
      bootWar -x test \
 && cp build/libs/ROOT.war /app.war

# ---------- 2) Yuz tanish modellari (YuNet + SFace, SHA-256 tekshiriladi) ----------
# Yuklab bo'lmasa build to'xtamaydi: ilova ishlaydi, faqat yuz tekshiruvi o'chiq qoladi.
# Modelsiz yig'ish: docker compose build --build-arg FACE_MODELS=false
FROM eclipse-temurin:21-jdk-noble AS face-models
ARG FACE_MODELS=true
COPY ops/face-models/install-face-models.sh /tmp/install-face-models.sh
RUN mkdir -p /face-models \
 && if [ "$FACE_MODELS" = "true" ]; then \
      sed -i 's/\r$//' /tmp/install-face-models.sh; \
      { command -v curl >/dev/null 2>&1 \
          || { apt-get update -qq && apt-get install -y -qq --no-install-recommends curl ca-certificates >/dev/null; }; } \
      && FACE_MODEL_DIR=/face-models bash /tmp/install-face-models.sh \
      || echo "OGOHLANTIRISH: yuz tanish modellari yuklanmadi, yuz tekshiruvi ishlamaydi"; \
    fi

# ---------- 3) Ishga tushadigan image (faqat JRE) ----------
FROM eclipse-temurin:21-jre-noble
# Ilova root emas, alohida foydalanuvchi bilan ishlaydi (UID 10001: bind-mount papkasiga chown qilish uchun)
RUN groupadd --system --gid 10001 scorm \
 && useradd --system --uid 10001 --gid scorm --home-dir /app --shell /usr/sbin/nologin scorm \
 && mkdir -p /app /data/logs \
 && chown -R scorm:scorm /data
WORKDIR /app
COPY --from=build /app.war /app/app.war
COPY --from=face-models /face-models /app/face-models

# Hammasi standart: env fayl shart emas. Almashtirish uchun docker/backend.env ga yozing.
ENV SPRING_PROFILES_ACTIVE=postgresql-prod \
    SERVER_PORT=8080 \
    APP_DATA_DIR=/data \
    LOG_FILE=/data/logs/scorm-lms.log \
    FACE_MODEL_DIR=/app/face-models \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError -Dfile.encoding=UTF-8"

USER scorm
EXPOSE 8080
# Yuklangan fayllar, SCORM paketlari, topshiriqlar, loglar
VOLUME ["/data"]

# curl'siz tekshiruv (bash /dev/tcp); birinchi ishga tushishda Flyway migratsiyalari uchun 3 daqiqa beriladi
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=3 \
  CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/${SERVER_PORT} && printf "GET /actuator/health/liveness HTTP/1.0\r\nHost: localhost\r\n\r\n" >&3 && grep -q "UP" <&3'

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.war"]
