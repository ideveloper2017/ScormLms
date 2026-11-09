package uz.scorm.lms.app.v1.auth

import jakarta.servlet.http.Cookie
import org.springframework.mock.web.MockHttpServletRequest
import uz.scorm.lms.app.v1.auth.service.RefreshTokenCookie
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull

class RefreshTokenCookieTest {

    private fun request(secure: Boolean = false, forwardedProto: String? = null) = MockHttpServletRequest().apply {
        isSecure = secure
        forwardedProto?.let { addHeader("X-Forwarded-Proto", it) }
    }

    @Test
    fun `cookie JavaScript uchun yopiq va faqat auth manziliga yuboriladi`() {
        val header = RefreshTokenCookie(secureSetting = "", sameSite = "Lax").issue(request(), "token-123")

        assertContains(header, "LMS_REFRESH=token-123")
        assertContains(header, "HttpOnly")
        assertContains(header, "Path=/api/v1/auth")
        assertContains(header, "SameSite=Lax")
        assertContains(header, "Max-Age=${14 * 24 * 3600}")
    }

    @Test
    fun `HTTPS so'rovda va nginx orqasida Secure belgisi qo'yiladi`() {
        val cookie = RefreshTokenCookie(secureSetting = "", sameSite = "Lax")

        assertContains(cookie.issue(request(secure = true), "t"), "Secure")
        assertContains(cookie.issue(request(forwardedProto = "https"), "t"), "Secure")
        // Lokal HTTP da Secure qo'yilsa brauzer cookie'ni saqlamaydi va kirib bo'lmay qoladi
        assertFalse(cookie.issue(request(), "t").contains("Secure"))
    }

    @Test
    fun `Secure belgisi sozlama bilan majburlanishi yoki o'chirilishi mumkin`() {
        assertContains(RefreshTokenCookie("true", "Lax").issue(request(), "t"), "Secure")
        assertFalse(RefreshTokenCookie("false", "Lax").issue(request(secure = true), "t").contains("Secure"))
    }

    @Test
    fun `context path cookie yo'liga qo'shiladi`() {
        val request = request().apply { contextPath = "/lms" }

        assertContains(RefreshTokenCookie("", "Lax").issue(request, "t"), "Path=/lms/api/v1/auth")
    }

    @Test
    fun `tozalash cookie'ni darhol eskirtadi`() {
        val header = RefreshTokenCookie("", "Lax").clear(request())

        assertContains(header, "LMS_REFRESH=;")
        assertContains(header, "Max-Age=0")
        assertContains(header, "HttpOnly")
    }

    @Test
    fun `so'rovdagi cookie o'qiladi, bo'sh yoki yo'q bo'lsa null`() {
        val cookie = RefreshTokenCookie("", "Lax")

        assertEquals("abc", cookie.read(request().apply { setCookies(Cookie("other", "x"), Cookie("LMS_REFRESH", "abc")) }))
        assertNull(cookie.read(request().apply { setCookies(Cookie("LMS_REFRESH", "")) }))
        assertNull(cookie.read(request()))
    }
}
