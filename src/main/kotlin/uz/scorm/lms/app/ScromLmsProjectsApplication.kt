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


    override fun configure(application: SpringApplicationBuilder): SpringApplicationBuilder {
        useProductionProfileUnlessConfigured()
        return application.sources(ScromLmsProjectsApplication::class.java)
    }

    /**
     * Bu metod faqat tashqi Tomcat (WAR) ishga tushganda chaqiriladi; lokal `bootRun`/`main` chaqirmaydi.
     * Profil env, `-D` yoki systemd orqali berilmagan bo'lsa production profili yoqiladi, shunda
     * `/etc/scorm-lms/scorm-lms.env` kabi qo'shimcha sozlama fayllarisiz ham WAR ishlaydi.
     * Biror joyda profil aniq berilgan bo'lsa u o'zgartirilmaydi.
     */
    private fun useProductionProfileUnlessConfigured() {
        val configured = listOf(
            System.getenv("SPRING_PROFILES_ACTIVE"),
            System.getProperty("SPRING_PROFILES_ACTIVE"),
            System.getProperty("spring.profiles.active"),
        ).any { !it.isNullOrBlank() }
        if (!configured) {
            System.setProperty("spring.profiles.active", "postgresql-prod")
        }
    }
}

fun main(args: Array<String>) {
    runApplication<ScromLmsProjectsApplication>(*args)
}
