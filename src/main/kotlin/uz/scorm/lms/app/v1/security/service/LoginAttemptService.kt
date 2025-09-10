package uz.scorm.lms.app.v1.security.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.security.model.LoginAttempt
import uz.scorm.lms.app.v1.security.repository.LoginAttemptRepository
import java.time.Duration
import java.time.Instant

@Service
class LoginAttemptService(
    private val repo: LoginAttemptRepository
) {
    // Policy
    private val window = Duration.ofMinutes(15)
    private val maxAttempts = 5
    private val baseLockDuration = Duration.ofMinutes(15)

    fun isLocked(username: String): Boolean {
        val rec = repo.findByUsername(username) ?: return false
        val lockedUntil = rec.lockedUntil ?: return false
        return lockedUntil.isAfter(Instant.now())
    }

    fun remainingLock(username: String): Duration? {
        val rec = repo.findByUsername(username) ?: return null
        val until = rec.lockedUntil ?: return null
        val now = Instant.now()
        return if (until.isAfter(now)) Duration.between(now, until) else null
    }

    @Transactional
    fun onFailure(username: String, ip: String?) {
        val now = Instant.now()
        val rec = repo.findByUsername(username) ?: LoginAttempt(username = username, ip = ip)
        if (rec.firstFailedAt == null || rec.firstFailedAt!!.isBefore(now.minus(window))) {
            // reset window
            rec.firstFailedAt = now
            rec.failedCount = 1
        } else {
            rec.failedCount += 1
        }
        rec.lastFailedAt = now

        if (rec.failedCount >= maxAttempts) {
            // Exponential backoff lock time: base * 2^(k-1)
            val multiplier = (rec.failedCount - maxAttempts + 1).coerceAtLeast(1)
            val lock = baseLockDuration.multipliedBy(1L shl (multiplier - 1))
            rec.lockedUntil = now.plus(lock)
            // reset counter after locking window
            rec.failedCount = 0
            rec.firstFailedAt = null
        }
        repo.save(rec)
    }

    @Transactional
    fun onSuccess(username: String) {
        val rec = repo.findByUsername(username) ?: return
        rec.failedCount = 0
        rec.firstFailedAt = null
        rec.lastFailedAt = null
        rec.lockedUntil = null
        repo.save(rec)
    }
}
