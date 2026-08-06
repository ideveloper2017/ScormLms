package uz.scorm.lms.app.security

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockHttpServletRequest

class SecurityPolicyTest {
    @Test
    fun `faqat ishonchli proxy yuborgan forwarded IP olinadi`() {
        val resolver = ClientIpResolver("127.0.0.1")
        val direct = MockHttpServletRequest().apply {
            remoteAddr = "198.51.100.1"
            addHeader("X-Forwarded-For", "203.0.113.1")
        }
        val proxied = MockHttpServletRequest().apply {
            remoteAddr = "127.0.0.1"
            addHeader("X-Forwarded-For", "203.0.113.2, 127.0.0.1")
        }
        assertEquals("198.51.100.1", resolver.resolve(direct))
        assertEquals("203.0.113.2", resolver.resolve(proxied))
    }

    @Test
    fun `parol uzunligi common qiymat va username tekshiriladi`() {
        val policy = PasswordPolicy()
        assertThrows(IllegalArgumentException::class.java) { policy.validate("short", "student") }
        assertThrows(IllegalArgumentException::class.java) { policy.validate("password1234", "student") }
        assertThrows(IllegalArgumentException::class.java) { policy.validate("secure-alice-password", "alice") }
        policy.validate("Long-and-random-2026!", "alice")
    }
}
