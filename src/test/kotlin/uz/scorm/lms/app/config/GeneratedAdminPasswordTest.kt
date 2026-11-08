package uz.scorm.lms.app.config

import uz.scorm.lms.app.security.PasswordPolicy
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class GeneratedAdminPasswordTest {

    @Test
    fun `generated first admin password satisfies the password policy`() {
        val passwords = (1..500).map { generateAdminPassword() }
        passwords.forEach { PasswordPolicy().validate(it, "admin") }
        assertTrue(passwords.all { it.length == 20 })
    }

    @Test
    fun `generated passwords are not repeated`() {
        val passwords = (1..200).map { generateAdminPassword() }
        assertEquals(passwords.size, passwords.toSet().size)
    }

    @Test
    fun `generated password avoids look-alike characters`() {
        val forbidden = setOf('0', 'O', '1', 'l', 'I')
        assertTrue((1..200).all { generateAdminPassword().none { c -> c in forbidden } })
    }
}
