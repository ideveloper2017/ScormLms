package uz.scorm.lms.app.config

import org.springframework.boot.SpringApplication
import org.springframework.mock.env.MockEnvironment
import kotlin.test.Test
import kotlin.test.assertEquals

class ProfileAliasEnvironmentPostProcessorTest {

    @Test
    fun `postgres va prod taxalluslari postgresql-prod ga aylanadi, CRLF tozalanadi`() {
        assertEquals("postgresql-prod", normalizeProfiles("postgres"))
        assertEquals("postgresql-prod,hemis-oauth", normalizeProfiles(" prod , hemis-oauth\r"))
        assertEquals("postgresql-prod,hemis-oauth", normalizeProfiles("postgresql-prod\r,hemis-oauth"))
        assertEquals("postgresql", normalizeProfiles("dev"))
        // To'g'ri nomlar o'zgarmaydi
        assertEquals("postgresql-prod,hemis-employee-oauth", normalizeProfiles("postgresql-prod,hemis-employee-oauth"))
        assertEquals("test", normalizeProfiles("test"))
    }

    @Test
    fun `muhitdagi spring profiles active qiymati config data dan oldin to'g'rilanadi`() {
        val environment = MockEnvironment().withProperty("spring.profiles.active", "postgres")
        ProfileAliasEnvironmentPostProcessor().postProcessEnvironment(environment, SpringApplication())
        assertEquals("postgresql-prod", environment.getProperty("spring.profiles.active"))
        // Guard ham qabul qiladi
        requireKnownProfiles(environment.getProperty("spring.profiles.active")!!.split(','))
    }
}
