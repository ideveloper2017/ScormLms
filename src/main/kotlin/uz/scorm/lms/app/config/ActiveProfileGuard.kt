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
        requireKnownProfiles(event.environment.activeProfiles.toList())
    }

    override fun getOrder(): Int = Ordered.LOWEST_PRECEDENCE
}

internal val baseProfiles = setOf("postgresql-dev", "postgresql-prod", "test")
internal val optionalProfiles = setOf("hemis-oauth", "hemis-employee-oauth")

internal fun requireKnownProfiles(activeProfiles: List<String>) {
    val unknown = activeProfiles.filterNot { it in baseProfiles || it in optionalProfiles }
    require(unknown.isEmpty()) {
        "Noma'lum Spring profil(lar): ${unknown.joinToString { "\"$it\"" }}. " +
            "SPRING_PROFILES_ACTIVE (yoki -Dspring.profiles.active) quyidagilardan biri bo'lishi kerak: " +
            "${baseProfiles.joinToString()}; qo'shimcha: ${optionalProfiles.joinToString()}. " +
            "Productionda: SPRING_PROFILES_ACTIVE=postgresql-prod"
    }
    val selectedBase = activeProfiles.filter { it in baseProfiles }.distinct()
    require(selectedBase.size == 1) {
        "Aynan bitta asosiy profil kerak (${baseProfiles.joinToString()}), berilgan: " +
            selectedBase.ifEmpty { listOf("yo'q") }.joinToString()
    }
}
