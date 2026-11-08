package uz.scorm.lms.app.config

import org.springframework.boot.SpringApplication
import org.springframework.boot.env.EnvironmentPostProcessor
import org.springframework.core.Ordered
import org.springframework.core.env.ConfigurableEnvironment
import org.springframework.core.env.MapPropertySource

/**
 * Profil nomlaridagi odatiy adashishlarni to'g'rilaydi: serverda SPRING_PROFILES_ACTIVE=postgres (yoki prod)
 * yozilsa, u postgresql-prod deb qabul qilinadi; env fayldagi CRLF ("postgresql-prod\r") ham tozalanadi.
 * Config data (application-*.yml) o'qilishidan OLDIN ishlaydi (HIGHEST_PRECEDENCE), aks holda prod yml yuklanmaydi.
 * META-INF/spring.factories orqali ro'yxatdan o'tadi.
 */
class ProfileAliasEnvironmentPostProcessor : EnvironmentPostProcessor, Ordered {

    override fun postProcessEnvironment(environment: ConfigurableEnvironment, application: SpringApplication) {
        val raw = environment.getProperty(PROPERTY) ?: return
        val normalized = normalizeProfiles(raw)
        if (normalized != raw) {
            environment.propertySources.addFirst(MapPropertySource("profileAliases", mapOf(PROPERTY to normalized)))
        }
    }

    override fun getOrder(): Int = Ordered.HIGHEST_PRECEDENCE

    companion object {
        const val PROPERTY = "spring.profiles.active"
    }
}

/** Profil taxalluslari -> haqiqiy nom */
internal val profileAliases = mapOf(
    "postgres" to "postgresql-prod",
    "prod" to "postgresql-prod",
    "production" to "postgresql-prod",
    "dev" to "postgresql",
    "local" to "postgresql",
)

/** "postgres, hemis-oauth\r" -> "postgresql-prod,hemis-oauth"; takrorlar olib tashlanadi, tartib saqlanadi. */
internal fun normalizeProfiles(raw: String): String = raw.split(',')
    .map { it.trim().trimEnd('\r', '\n') }
    .filter { it.isNotEmpty() }
    .map { profileAliases[it.lowercase()] ?: it }
    .distinct()
    .joinToString(",")
