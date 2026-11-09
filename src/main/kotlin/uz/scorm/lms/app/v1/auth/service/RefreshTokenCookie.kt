package uz.scorm.lms.app.v1.auth.service

import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.ResponseCookie
import org.springframework.stereotype.Component
import java.time.Duration

/**
 * Refresh token brauzerda JavaScript o'qiy olmaydigan (HttpOnly) cookie'da saqlanadi.
 *
 * Ilgari u `localStorage`da turardi: sahifaga tushgan har qanday begona skript (XSS) 14 kunlik tokenni
 * o'g'irlab keta olardi. Cookie faqat `/api/v1/auth` manziliga yuboriladi, shuning uchun oddiy API
 * so'rovlarida qatnashmaydi va CSRF yuzasi faqat yangilash/chiqish bilan cheklanadi.
 */
@Component
class RefreshTokenCookie(
    /** `true`/`false` — majburiy qiymat; bo'sh bo'lsa so'rov HTTPS orqali kelgan-kelmaganiga qarab aniqlanadi. */
    @param:Value("\${app.auth.refresh-cookie.secure:}") private val secureSetting: String,
    /** Frontend va API bitta saytda bo'lsa `Lax` yetarli; boshqa saytda bo'lsa `None` (faqat HTTPS bilan). */
    @param:Value("\${app.auth.refresh-cookie.same-site:Lax}") private val sameSite: String,
) {
    fun issue(request: HttpServletRequest, token: String, lifetime: Duration = DEFAULT_LIFETIME): String =
        build(request, token, lifetime)

    /** Brauzerdagi cookie'ni o'chiradi (chiqish yoki yaroqsiz token). */
    fun clear(request: HttpServletRequest): String = build(request, "", Duration.ZERO)

    fun read(request: HttpServletRequest): String? =
        request.cookies?.firstOrNull { it.name == NAME }?.value?.takeIf { it.isNotBlank() }

    private fun build(request: HttpServletRequest, value: String, maxAge: Duration): String =
        ResponseCookie.from(NAME, value)
            .httpOnly(true)
            .secure(isSecure(request))
            .sameSite(sameSite)
            .path(request.contextPath.orEmpty() + PATH)
            .maxAge(maxAge)
            .build()
            .toString()

    private fun isSecure(request: HttpServletRequest): Boolean = when (secureSetting.trim().lowercase()) {
        "true" -> true
        "false" -> false
        // Nginx orqasida Tomcat so'rovni HTTP deb ko'radi: asl sxema X-Forwarded-Proto'da keladi
        else -> request.isSecure || request.getHeader("X-Forwarded-Proto").equals("https", ignoreCase = true)
    }

    companion object {
        const val NAME = "LMS_REFRESH"
        const val PATH = "/api/v1/auth"
        val DEFAULT_LIFETIME: Duration = Duration.ofDays(14)
    }
}
