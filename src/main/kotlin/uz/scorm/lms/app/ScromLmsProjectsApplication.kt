package uz.scorm.lms.app

import jakarta.annotation.PostConstruct
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.builder.SpringApplicationBuilder
import org.springframework.boot.runApplication
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.scheduling.annotation.EnableAsync
import java.util.TimeZone

@SpringBootApplication
@EnableScheduling
@EnableAsync
class ScromLmsProjectsApplication : SpringBootServletInitializer() {

    @PostConstruct
    fun init() {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
    }

    /**
     * Bu metod faqat tashqi Tomcat (WAR) ishga tushganda chaqiriladi; lokal `bootRun`/`main` chaqirmaydi.
     *
     * Tomcat'da ilova har doim baza sozlamalari bor profil bilan ishga tushishi kerak, aks holda
     * `app.jwt.secret`, `spring.datasource.*` kabi qiymatlar topilmay "Could not resolve placeholder 'JWT_SECRET'"
     * (jwtService) xatosi bilan yiqiladi. Shuning uchun:
     *  - profil umuman berilmagan bo'lsa production profili yoqiladi (env faylsiz ham WAR ishlaydi);
     *  - profil berilgan, lekin unda baza profili yo'q bo'lsa (masalan serverda "postgres" deb yozilgan yoki faqat
     *    `hemis-oauth`) production profili ularga QO'SHILADI — bu `application.yml` dagi taxallusga bog'liq emas;
     *  - `postgresql`, `postgresql-prod` yoki `test` aniq berilgan bo'lsa hech narsa o'zgarmaydi.
     */
    override fun configure(application: SpringApplicationBuilder): SpringApplicationBuilder {
        val configured = listOf(
            System.getenv("SPRING_PROFILES_ACTIVE"),
            System.getProperty("SPRING_PROFILES_ACTIVE"),
            System.getProperty("spring.profiles.active"),
        )
        when (warProfileAction(configured)) {
            WarProfileAction.ACTIVATE_PRODUCTION -> System.setProperty("spring.profiles.active", PRODUCTION_PROFILE)
            WarProfileAction.ADD_PRODUCTION -> application.profiles(PRODUCTION_PROFILE)
            WarProfileAction.KEEP -> Unit
        }
        return application.sources(ScromLmsProjectsApplication::class.java)
    }
}

internal const val PRODUCTION_PROFILE = "postgresql-prod"

/** Baza ulanishi va boshqa majburiy sozlamalarni o'zi beradigan profillar. */
private val DATABASE_PROFILES = setOf("postgresql", PRODUCTION_PROFILE, "test")

internal enum class WarProfileAction { KEEP, ACTIVATE_PRODUCTION, ADD_PRODUCTION }

/** WAR ishga tushganda profil bilan nima qilinishini aniqlaydi; `configured` — env va tizim xossalaridagi qiymatlar. */
internal fun warProfileAction(configured: List<String?>): WarProfileAction {
    val profiles = configured.filterNotNull().flatMap { it.split(',') }.map { it.trim() }.filter { it.isNotEmpty() }
    return when {
        profiles.isEmpty() -> WarProfileAction.ACTIVATE_PRODUCTION
        profiles.any { it in DATABASE_PROFILES } -> WarProfileAction.KEEP
        else -> WarProfileAction.ADD_PRODUCTION
    }
}

fun main(args: Array<String>) {
    runApplication<ScromLmsProjectsApplication>(*args)
}
