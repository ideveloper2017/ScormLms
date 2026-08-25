package uz.scorm.lms.app.security

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.options
import org.springframework.test.web.servlet.post
import uz.scorm.lms.app.v1.audit.repository.AuditLogRepository

@SpringBootTest(properties = [
    "app.security.rate-limit.window-seconds=60",
    "app.security.rate-limit.login-per-ip=3",
    "app.security.trusted-proxy-ips=127.0.0.1",
    "app.cors.allowed-origins=https://lms.test",
    "management.endpoint.health.probes.enabled=true",
])
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SecurityHardeningIntegrationTest {
    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var auditRepository: AuditLogRepository

    @Test
    fun `readiness probe deploy health check uchun ochiq`() {
        mockMvc.get("/actuator/health/readiness").andExpect {
            status { isOk() }
            jsonPath("$.status") { value("UP") }
        }
    }

    @Test
    fun `himoyalangan endpoint security headerlar bilan 401 qaytaradi`() {
        mockMvc.get("/api/v1/users").andExpect {
            status { isUnauthorized() }
            header { string("X-Frame-Options", "DENY") }
            header { string("X-Content-Type-Options", "nosniff") }
            header { string("Referrer-Policy", "no-referrer") }
            header { string("Permissions-Policy", "camera=(self), microphone=(), geolocation=()") }
        }
    }

    @Test
    fun `CORS faqat aniq ruxsat etilgan originni qabul qiladi`() {
        mockMvc.options("/api/v1/auth/login") {
            header(HttpHeaders.ORIGIN, "https://lms.test")
            header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
        }.andExpect {
            status { isOk() }
            header { string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://lms.test") }
        }
        mockMvc.options("/api/v1/auth/login") {
            header(HttpHeaders.ORIGIN, "https://evil.test")
            header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
        }.andExpect {
            status { isForbidden() }
            header { doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN) }
        }
    }

    @Test
    fun `login IP limiti turli username bilan aylanib otilmaydi`() {
        repeat(3) { index ->
            mockMvc.post("/api/v1/auth/login") {
                with { it.remoteAddr = "198.51.100.20"; it }
                contentType = MediaType.APPLICATION_JSON
                content = """{"username":"missing-$index","password":"wrong-password"}"""
            }.andExpect { status { isUnauthorized() } }
        }
        mockMvc.post("/api/v1/auth/login") {
            with { it.remoteAddr = "198.51.100.20"; it }
            contentType = MediaType.APPLICATION_JSON
            content = """{"username":"another-user","password":"wrong-password"}"""
        }.andExpect {
            status { isTooManyRequests() }
            header { string("Retry-After", "60") }
            jsonPath("$.success") { value(false) }
        }
    }

    @Test
    @WithMockUser(username = "security-auditor", authorities = ["AUDIT_READ"])
    fun `audit bitta yozuv saqlaydi va spoofed IP hamda xom queryni qabul qilmaydi`() {
        val before = auditRepository.count()
        mockMvc.get("/api/v1/audit?token=raw-secret") {
            with { it.remoteAddr = "198.51.100.30"; it }
            header("X-Forwarded-For", "203.0.113.99")
            header("Referer", "https://evil.test/raw-secret")
            header("X-Request-Id", "invalid request id")
        }.andExpect { status { isOk() } }

        assertEquals(before + 1, auditRepository.count())
        val latest = auditRepository.findTop200ByOrderByTimestampDesc().first()
        assertEquals("198.51.100.30", latest.ip)
        assertFalse(latest.details.orEmpty().contains("raw-secret"))
        assertFalse(latest.details.orEmpty().contains("invalid"))
    }
}
