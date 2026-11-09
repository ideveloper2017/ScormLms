package uz.scorm.lms.app.v1.auth.dto

import com.fasterxml.jackson.annotation.JsonInclude

data class JwtResponse(
    val accessToken: String,
    /** Brauzer uchun refresh token HttpOnly cookie'da; javobda faqat eski (sarlavha orqali) mijozlarga qaytadi. */
    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    val refreshToken: String? = null,
    val tokenType: String = "Bearer",
    val expiresIn: Long
)
