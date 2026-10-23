package uz.scorm.lms.app.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Lazy
import org.springframework.context.annotation.Profile

/**
 * Productionda dev/test/namuna secretlar bilan ishga tushishni to'xtatadi.
 * Global lazy-initialization yoqilgani uchun @Lazy(false) — aks holda tekshiruv ishlamaydi.
 */
@Configuration(proxyBeanMethods = false)
@Profile("postgresql-prod")
@Lazy(false)
class ProductionSecretsGuard(
    @param:Value("\${app.jwt.secret}") jwtSecret: String,
    @param:Value("\${app.survey.anonymization-secret}") surveySecret: String,
    @param:Value("\${spring.datasource.password}") databasePassword: String,
) {
    init {
        requireProductionSecret("JWT_SECRET", jwtSecret, MIN_HMAC_SECRET_BYTES)
        requireProductionSecret("SURVEY_ANONYMIZATION_SECRET", surveySecret, MIN_HMAC_SECRET_BYTES)
        requireProductionSecret("DB_PASSWORD", databasePassword, MIN_DATABASE_PASSWORD_LENGTH)
    }
}

internal const val MIN_HMAC_SECRET_BYTES = 64
internal const val MIN_DATABASE_PASSWORD_LENGTH = 12

private val placeholderMarkers = listOf("dev-only", "test-only", "change_me", "changeme")

internal fun requireProductionSecret(name: String, value: String, minBytes: Int) {
    val lowered = value.lowercase()
    require(placeholderMarkers.none { lowered.contains(it) }) {
        "$name productionda dev/test yoki namuna qiymat bo'lishi mumkin emas. Tasodifiy qiymat bering."
    }
    require(value.toByteArray(Charsets.UTF_8).size >= minBytes) {
        "$name kamida $minBytes bayt bo'lishi kerak (masalan: openssl rand -base64 96)."
    }
}
