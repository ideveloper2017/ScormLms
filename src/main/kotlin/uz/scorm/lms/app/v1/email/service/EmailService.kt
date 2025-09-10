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

    // Stub: replace with real email sender (SMTP/SES/etc.)
    fun sendVerificationEmail(email: String, token: String) {
        log.info("[EmailService] Sending verification email to {} with token {}", email, token)
    }
}
