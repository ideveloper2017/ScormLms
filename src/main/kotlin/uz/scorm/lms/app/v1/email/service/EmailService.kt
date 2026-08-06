package uz.scorm.lms.app.v1.email.service

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

@Service
class EmailService {
    private val log = LoggerFactory.getLogger(EmailService::class.java)

    fun generateVerificationToken(): String = UUID.randomUUID().toString().replace("-", "")

    fun expiration(hours: Long = 24): Instant = Instant.now().plus(hours, ChronoUnit.HOURS)

    fun sendVerificationEmail(email: String, token: String) {
        log.info("[EMAIL] Verification requested for {} (provider integration required)", masked(email))
    }

    fun sendPasswordResetEmail(email: String, token: String) {
        log.info("[EMAIL] Password reset requested for {} (provider integration required)", masked(email))
    }

    private fun masked(email: String): String =
        email.substringBefore('@').take(2) + "***@" + email.substringAfter('@', "unknown")
}
