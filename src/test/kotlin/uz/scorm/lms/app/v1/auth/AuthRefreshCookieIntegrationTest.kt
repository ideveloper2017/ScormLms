package uz.scorm.lms.app.v1.auth

import jakarta.servlet.http.Cookie
import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.MvcResult
import org.springframework.test.web.servlet.post
import uz.scorm.lms.app.v1.auth.service.RefreshTokenCookie
import uz.scorm.lms.app.v1.user.service.UserService

/**
 * Refresh token brauzerga faqat HttpOnly cookie orqali beriladi: javob tanasida ko'rinmaydi,
 * har yangilashda almashadi va chiqishda bekor qilinadi.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthRefreshCookieIntegrationTest {
    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var userService: UserService

    private val username = "cookie-auth-user"
    private val password = "C00kie-Auth-Passw0rd!"

    @BeforeEach
    fun createUser() {
        userService.register(username, password, "student")
    }

    private fun login(): MvcResult = mockMvc.post("/api/v1/auth/login") {
        contentType = MediaType.APPLICATION_JSON
        content = """{"username":"$username","password":"$password"}"""
    }.andExpect { status { isOk() } }.andReturn()

    private fun MvcResult.refreshCookie(): Cookie =
        requireNotNull(response.getCookie(RefreshTokenCookie.NAME)) { "Javobda ${RefreshTokenCookie.NAME} cookie yo'q" }

    private fun MvcResult.setCookieHeader(): String =
        response.getHeaders(HttpHeaders.SET_COOKIE).first { it.startsWith(RefreshTokenCookie.NAME + "=") }

    @Test
    fun `login refresh tokenni faqat HttpOnly cookie'da beradi`() {
        val result = login()

        val header = result.setCookieHeader()
        assertTrue(header.contains("HttpOnly"), header)
        assertTrue(header.contains("Path=/api/v1/auth"), header)
        assertTrue(header.contains("SameSite=Lax"), header)
        assertTrue(result.refreshCookie().value.length >= 64)

        val body = result.response.contentAsString
        assertTrue(body.contains("\"accessToken\""), body)
        assertFalse(body.contains("refreshToken"), "Refresh token javob tanasida bo'lmasligi kerak: $body")
        assertFalse(body.contains(result.refreshCookie().value))
    }

    @Test
    fun `cookie bilan yangilash tokenni almashtiradi va eski token qayta ishlamaydi`() {
        val first = login().refreshCookie()

        val refreshed = mockMvc.post("/api/v1/auth/refresh-token") { cookie(first) }
            .andExpect {
                status { isOk() }
                jsonPath("$.data.accessToken") { isNotEmpty() }
                jsonPath("$.data.refreshToken") { doesNotExist() }
            }.andReturn()
        val second = refreshed.refreshCookie()
        assertNotEquals(first.value, second.value)

        // Eski (almashtirilgan) token: rad etiladi va brauzerdagi cookie tozalanadi
        val replay = mockMvc.post("/api/v1/auth/refresh-token") { cookie(first) }
            .andExpect { status { isUnauthorized() } }.andReturn()
        assertTrue(replay.setCookieHeader().contains("Max-Age=0"))

        mockMvc.post("/api/v1/auth/refresh-token") { cookie(second) }.andExpect { status { isOk() } }
    }

    @Test
    fun `sarlavha orqali yangilaydigan eski mijoz tokenni javob tanasida oladi`() {
        val token = login().refreshCookie().value

        val result = mockMvc.post("/api/v1/auth/refresh-token") { header(HttpHeaders.AUTHORIZATION, "Bearer $token") }
            .andExpect {
                status { isOk() }
                jsonPath("$.data.refreshToken") { isNotEmpty() }
            }.andReturn()
        // Brauzer keyingi safar cookie bilan davom etishi uchun cookie ham beriladi (localStorage'dan ko'chish)
        assertNotNull(result.response.getCookie(RefreshTokenCookie.NAME))
    }

    @Test
    fun `tokensiz yangilash so'rovi 401 qaytaradi`() {
        mockMvc.post("/api/v1/auth/refresh-token").andExpect {
            status { isUnauthorized() }
            jsonPath("$.success") { value(false) }
        }
    }

    @Test
    fun `chiqish tokenni bekor qiladi va cookie'ni o'chiradi`() {
        val cookie = login().refreshCookie()

        val logout = mockMvc.post("/api/v1/auth/logout") { cookie(cookie) }
            .andExpect { status { isNoContent() } }.andReturn()
        assertTrue(logout.setCookieHeader().contains("Max-Age=0"))
        assertEquals("", logout.refreshCookie().value)

        mockMvc.post("/api/v1/auth/refresh-token") { cookie(cookie) }.andExpect { status { isUnauthorized() } }
    }
}
