package uz.scorm.lms.app.v1.auth.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.auth.model.RefreshToken
import uz.scorm.lms.app.v1.auth.repository.RefreshTokenRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.security.SecureRandom
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.*

@Service
class RefreshTokenService(
    private val refreshTokenRepository: RefreshTokenRepository,
    private val userRepository: UserRepository
) {
    private val random = SecureRandom()

    fun generateTokenString(): String {
        val bytes = ByteArray(64)
        random.nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    fun create(user: User, expiresInDays: Long = 14): RefreshToken {
        val token = RefreshToken(
            token = generateTokenString(),
            user = user,
            expiresAt = Instant.now().plus(expiresInDays, ChronoUnit.DAYS),
            revoked = false,
            createdAt = Instant.now()
        )
        return refreshTokenRepository.save(token)
    }

    fun validate(rawToken: String): RefreshToken {
        val token = refreshTokenRepository.findByToken(rawToken)
            ?: throw IllegalArgumentException("Invalid refresh token")
        if (token.revoked) throw IllegalStateException("Refresh token revoked")
        if (token.expiresAt.isBefore(Instant.now())) throw IllegalStateException("Refresh token expired")
        return token
    }

    @Transactional
    fun rotate(oldRawToken: String, expiresInDays: Long = 14): RefreshToken {
        val old = validate(oldRawToken)
        // revoke old and create a new one
        old.revoked = true
        val newToken = create(old.user!!, expiresInDays)
        old.replacedByToken = newToken.token
        return newToken
    }

    @Transactional
    fun revoke(rawToken: String) {
        val token = refreshTokenRepository.findByToken(rawToken) ?: return
        token.revoked = true
    }

    @Transactional
    fun revokeAllForUser(username: String) {
        val user = userRepository.findByUsername(username) ?: return
        val all = refreshTokenRepository.findAll().filter { it.user?.id == user.id && !it.revoked }
        all.forEach { it.revoked = true }
    }
}
