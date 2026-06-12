package uz.scorm.lms.app.v1.email.service

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.*

@Service
class EmailService {
    private val log = LoggerFactory.getLogger(EmailService::class.java)

    fun generateVerificationToken(): String = UUID.randomUUID().toString().replace("-", "")

    fun expiration(hours: Long = 24): Instant = Instant.now().plus(hours, ChronoUnit.HOURS)

    fun sendVerificationEmail(email: String, token: String) {
        log.info("[EMAIL] Verification → {} | token={}", email, token)
    }

    fun sendPasswordResetEmail(email: String, token: String) {
        // TODO: real SMTP/SES integratsiyasiga almashtiring
        log.info("[EMAIL] Password reset → {} | token={}", email, token)
        log.info("[EMAIL] Reset link: /reset-password?token={}", token)
    }
}
