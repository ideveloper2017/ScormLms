package uz.scorm.lms.app.config

import kotlin.test.Test
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class ActiveProfileGuardTest {

    @Test
    fun `supported profile combinations are accepted`() {
        requireKnownProfiles(listOf("postgresql-prod"))
        requireKnownProfiles(listOf("postgresql-prod", "hemis-oauth"))
        requireKnownProfiles(listOf("postgresql-prod", "hemis-oauth", "hemis-employee-oauth"))
        requireKnownProfiles(listOf("postgresql-dev"))
        requireKnownProfiles(listOf("test"))
    }

    @Test
    fun `unknown profile is rejected with a hint`() {
        val error = assertFailsWith<IllegalArgumentException> {
            requireKnownProfiles(listOf("postgres"))
        }

        assertTrue(error.message.orEmpty().contains("\"postgres\""))
        assertTrue(error.message.orEmpty().contains("SPRING_PROFILES_ACTIVE=postgresql-prod"))
    }

    @Test
    fun `missing or conflicting base profile is rejected`() {
        assertFailsWith<IllegalArgumentException> { requireKnownProfiles(listOf("hemis-oauth")) }
        assertFailsWith<IllegalArgumentException> { requireKnownProfiles(emptyList()) }
        assertFailsWith<IllegalArgumentException> {
            requireKnownProfiles(listOf("postgresql-dev", "postgresql-prod"))
        }
    }
}
