package uz.scorm.lms.app.v1.auth.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.auth.model.HemisOAuthLoginCode
import uz.scorm.lms.app.v1.auth.repository.HemisOAuthLoginCodeRepository
import uz.scorm.lms.app.v1.user.model.User
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Base64

@Service
class HemisOAuthLoginCodeService(
    private val repository: HemisOAuthLoginCodeRepository,
    @Value("\${app.hemis.oauth.login-code-ttl-seconds:60}") private val ttlSeconds: Long,
) {
    private val random = SecureRandom()

    init {
        require(ttlSeconds in 30..300) { "HEMIS OAuth login code TTL 30-300 soniya oralig'ida bo'lishi kerak" }
    }

    @Transactional
    fun issue(user: User): String {
        val rawCode = ByteArray(32).also(random::nextBytes)
            .let { Base64.getUrlEncoder().withoutPadding().encodeToString(it) }
        val now = Instant.now()
        repository.deleteByExpiresAtBefore(now)
        repository.save(
            HemisOAuthLoginCode(
                codeHash = hash(rawCode),
                user = user,
                expiresAt = now.plus(ttlSeconds, ChronoUnit.SECONDS),
                createdAt = now,
            )
        )
        return rawCode
    }

    @Transactional
    fun consume(rawCode: String): User {
        require(rawCode.length in 40..100) { "HEMIS login kodi yaroqsiz" }
        val loginCode = repository.findByCodeHashForUpdate(hash(rawCode))
            ?: throw IllegalArgumentException("HEMIS login kodi yaroqsiz yoki ishlatilgan")
        val now = Instant.now()
        if (loginCode.consumedAt != null || !loginCode.expiresAt.isAfter(now)) {
            throw IllegalArgumentException("HEMIS login kodi yaroqsiz yoki muddati tugagan")
        }
        loginCode.consumedAt = now
        return loginCode.user
    }

    private fun hash(value: String): String = MessageDigest.getInstance("SHA-256")
        .digest(value.toByteArray(Charsets.UTF_8))
        .joinToString("") { "%02x".format(it) }
}
