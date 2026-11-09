package uz.scorm.lms.app

import org.springframework.boot.WebApplicationType
import org.springframework.boot.builder.SpringApplicationBuilder
import org.springframework.context.annotation.Configuration
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * Tomcat'da profil qanday berilgan bo'lmasin (yoki umuman berilmasin), production sozlamalari yuklanishi kerak.
 * Aks holda ilova "Could not resolve placeholder 'JWT_SECRET'" (jwtService) xatosi bilan ishga tushmaydi.
 */
class WarProfileSelectionTest {

    @Configuration(proxyBeanMethods = false)
    class NoBeans

    @Test
    fun `profil berilmagan bo'lsa production profili yoqiladi`() {
        assertEquals(WarProfileAction.ACTIVATE_PRODUCTION, warProfileAction(listOf(null, "", "  ")))
        assertEquals(WarProfileAction.ACTIVATE_PRODUCTION, warProfileAction(emptyList()))
    }

    @Test
    fun `baza profili bo'lmagan nomga production profili qo'shiladi`() {
        assertEquals(WarProfileAction.ADD_PRODUCTION, warProfileAction(listOf("postgres")))
        assertEquals(WarProfileAction.ADD_PRODUCTION, warProfileAction(listOf(null, "hemis-oauth, hemis-employee-oauth")))
        assertEquals(WarProfileAction.ADD_PRODUCTION, warProfileAction(listOf("prod")))
    }

    @Test
    fun `aniq berilgan baza profili o'zgartirilmaydi`() {
        assertEquals(WarProfileAction.KEEP, warProfileAction(listOf("postgresql-prod")))
        assertEquals(WarProfileAction.KEEP, warProfileAction(listOf("postgresql-prod,hemis-oauth")))
        // systemd EnvironmentFile'dagi Windows qator oxiri (\r) qoldig'i ham tozalanadi
        assertEquals(WarProfileAction.KEEP, warProfileAction(listOf(" postgresql-prod \r")))
        assertEquals(WarProfileAction.KEEP, warProfileAction(listOf("postgresql")))
        assertEquals(WarProfileAction.KEEP, warProfileAction(listOf("test")))
    }

    @Test
    fun `serverdagi postgres profili bilan ham JWT siri va baza sozlamalari hal bo'ladi`() {
        // WAR ishga tushishidagi holatni takrorlaydi: tashqaridan "postgres" berilgan, production profili qo'shiladi.
        // application.yml dagi taxallus (spring.profiles.group) bo'sh qilib o'chirilgan: usiz ham ishlashi kerak.
        SpringApplicationBuilder(NoBeans::class.java)
            .web(WebApplicationType.NONE)
            .profiles(PRODUCTION_PROFILE)
            .run(
                "--spring.profiles.active=postgres",
                "--spring.profiles.group.postgres=",
                "--LOG_FILE=build/test-logs/war-profile.log",
            )
            .use { context ->
                val env = context.environment
                assertTrue(PRODUCTION_PROFILE in env.activeProfiles, env.activeProfiles.joinToString())
                assertTrue(requireNotNull(env.getProperty("app.jwt.secret")).toByteArray().size >= 64)
                assertTrue(requireNotNull(env.getProperty("spring.datasource.url")).startsWith("jdbc:postgresql://"))
                assertTrue(!env.getProperty("spring.datasource.password").isNullOrBlank())
            }
    }
}
