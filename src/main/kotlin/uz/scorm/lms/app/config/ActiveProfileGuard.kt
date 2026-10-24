package uz.scorm.lms.app.config

import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent
import org.springframework.context.ApplicationListener
import org.springframework.core.Ordered

/**
 * Noma'lum profil bilan ishga tushishni to'xtatadi. Masalan serverda "postgres" profili
 * berilsa, application-postgresql-prod.yml yuklanmaydi va ilova prod himoyalarisiz
 * ("Could not resolve placeholder ..." kabi tushunarsiz xatolar bilan) ko'tariladi.
 *
 * META-INF/spring.factories orqali ro'yxatdan o'tadi: bean'lardan oldin, tashqi Tomcat'dagi
 * WAR'da ham ishlaydi. LOWEST_PRECEDENCE — config data (spring.profiles.active) yuklangandan keyin.
 */
class ActiveProfileGuard : ApplicationListener<ApplicationEnvironmentPreparedEvent>, Ordered {

    override fun onApplicationEvent(event: ApplicationEnvironmentPreparedEvent) {
        val environment = event.environment
        requireKnownProfiles(environment.activeProfiles.toList())
        if ("postgresql-prod" in environment.activeProfiles) {
            requireProductionSettings { key ->
                runCatching { environment.getProperty(key) }.getOrNull()
            }
        }
    }

    override fun getOrder(): Int = Ordered.LOWEST_PRECEDENCE
}

// Spring datasource hal qilinmagan "${DB_PASSWORD}" ni so'zma-so'z parol sifatida yuboradi va
// faqat "password authentication failed" chiqadi; shuning uchun hammasini oldindan tekshiramiz.
internal val requiredProductionSettings = linkedMapOf(
    "spring.datasource.password" to "DB_PASSWORD",
    "app.jwt.secret" to "JWT_SECRET",
    "app.cors.allowed-origins" to "CORS_ALLOWED_ORIGINS",
)

internal fun requireProductionSettings(resolve: (String) -> String?) {
    val missing = requiredProductionSettings
        .filter { (key, _) -> resolve(key).isNullOrBlank() }
        .values
    require(missing.isEmpty()) {
        "postgresql-prod profili uchun env o'zgaruvchi(lar) berilmagan: ${missing.joinToString()}. " +
            "Ularni Tomcat muhitiga qo'shing (masalan /opt/tomcat/bin/setenv.sh yoki /etc/scorm-lms/scorm-lms.env)."
    }
}

internal val baseProfiles = setOf("postgresql-dev", "postgresql-prod", "test")
internal val optionalProfiles = setOf("hemis-oauth")

// application.yml dagi spring.profiles.group orqali asosiy profilni yoqadigan taxalluslar.
internal val profileAliases = mapOf("postgres" to "postgresql-prod")

internal fun requireKnownProfiles(activeProfiles: List<String>) {
    val unknown = activeProfiles.filterNot {
        it in baseProfiles || it in optionalProfiles || it in profileAliases
    }
    require(unknown.isEmpty()) {
        "Noma'lum Spring profil(lar): ${unknown.joinToString { "\"$it\"" }}. " +
            "SPRING_PROFILES_ACTIVE (yoki -Dspring.profiles.active) quyidagilardan biri bo'lishi kerak: " +
            "${baseProfiles.joinToString()}; qo'shimcha: ${optionalProfiles.joinToString()}; " +
            "taxallus: ${profileAliases.entries.joinToString { "${it.key} -> ${it.value}" }}. " +
            "Productionda: SPRING_PROFILES_ACTIVE=postgresql-prod"
    }
    val selectedBase = activeProfiles.filter { it in baseProfiles }.distinct()
    require(selectedBase.size == 1) {
        "Aynan bitta asosiy profil kerak (${baseProfiles.joinToString()}), berilgan: " +
            selectedBase.ifEmpty { listOf("yo'q") }.joinToString()
    }
}
