package uz.scorm.lms.app.v1.email.service

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.ObjectProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

/**
 * Email yuborish (parolni tiklash, email tasdiqlash). SMTP `spring.mail.*` (MAIL_HOST, MAIL_USERNAME, ...) bilan
 * sozlanadi; MAIL_HOST bo'sh bo'lsa xat yuborilmaydi va bu haqda aniq log yoziladi — ilova ishdan to'xtamaydi.
 */
@Service
class EmailService(
    private val mailSender: ObjectProvider<JavaMailSender>,
    @param:Value("\${spring.mail.host:}") private val smtpHost: String,
    @param:Value("\${app.mail.from:}") private val fromAddress: String,
    @param:Value("\${spring.mail.username:}") private val smtpUsername: String,
    @param:Value("\${app.frontend-url:http://localhost:5173}") private val frontendUrl: String,
) {
    private val log = LoggerFactory.getLogger(EmailService::class.java)

    fun generateVerificationToken(): String = UUID.randomUUID().toString().replace("-", "")

    fun expiration(hours: Long = 24): Instant = Instant.now().plus(hours, ChronoUnit.HOURS)

    val configured: Boolean get() = smtpHost.isNotBlank() && mailSender.ifAvailable != null

    fun sendVerificationEmail(email: String, token: String) {
        send(
            email, "Email manzilini tasdiqlash",
            "Assalomu alaykum!\n\nEmail manzilingizni tasdiqlash uchun quyidagi havolaga o'ting (24 soat amal qiladi):\n" +
                "${frontendUrl.trimEnd('/')}/verify-email?token=$token\n\n" +
                "Agar bu so'rovni siz yubormagan bo'lsangiz, xatni e'tiborsiz qoldiring.",
        )
    }

    fun sendPasswordResetEmail(email: String, token: String) {
        send(
            email, "Parolni tiklash",
            "Assalomu alaykum!\n\nParolingizni tiklash uchun quyidagi havolaga o'ting (24 soat amal qiladi):\n" +
                "${frontendUrl.trimEnd('/')}/reset-password?token=$token\n\n" +
                "Agar parolni tiklashni siz so'ramagan bo'lsangiz, xatni e'tiborsiz qoldiring — parolingiz o'zgarmaydi.",
        )
    }

    private fun send(recipient: String, subject: String, body: String) {
        val sender = mailSender.ifAvailable
        if (smtpHost.isBlank() || sender == null) {
            log.warn("[EMAIL] SMTP sozlanmagan (MAIL_HOST bo'sh) — \"{}\" xati {} manziliga yuborilmadi", subject, masked(recipient))
            return
        }
        val message = SimpleMailMessage()
        message.setTo(recipient)
        message.subject = "[SCORM LMS] $subject"
        message.text = body
        fromAddress.ifBlank { smtpUsername }.takeIf { it.isNotBlank() }?.let { message.from = it }
        try {
            sender.send(message)
            log.info("[EMAIL] \"{}\" xati {} manziliga yuborildi", subject, masked(recipient))
        } catch (e: org.springframework.mail.MailException) {
            // Xat ketmasa ham foydalanuvchi so'rovi (parol tiklash) 500 bilan yiqilmasin — sabab logda
            log.error("[EMAIL] \"{}\" xati {} manziliga yuborilmadi: {}", subject, masked(recipient), e.message)
        }
    }

    private fun masked(email: String): String =
        email.substringBefore('@').take(2) + "***@" + email.substringAfter('@', "unknown")
}
