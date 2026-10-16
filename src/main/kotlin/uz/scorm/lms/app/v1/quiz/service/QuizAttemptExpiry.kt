package uz.scorm.lms.app.v1.quiz.service

import jakarta.persistence.EntityManager
import jakarta.persistence.LockModeType
import mu.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.quiz.model.QuizAttempt
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
import java.time.Duration
import java.time.Instant

/**
 * Tashlab ketilgan test urinishlarini yopadi. Avval muddati o'tgan urinish faqat talaba testni qayta
 * boshlaganda yopilardi; qaytmagan talabaning urinishi abadiy IN_PROGRESS qolib, vedomost va o'rtacha
 * ballga umuman kirmasdi (past ball kutilgan testni tashlab ketish foydali bo'lib qolardi).
 */
@Service
class QuizAttemptExpiryService(
    private val em: EntityManager,
    private val quizService: QuizService,
) {
    companion object {
        /**
         * Javob qabul qilish muddatdan keyin 30 soniya ochiq (QuizService.requireSubmissionOpen) —
         * yopishni undan keyinroq qilamiz, talabaning so'nggi yuborishi bilan to'qnashmasin.
         */
        val CLOSE_AFTER: Duration = Duration.ofMinutes(2)
        private const val BATCH = 100
    }

    @Transactional(readOnly = true)
    fun expiredIds(afterId: Long, now: Instant): List<Long> = em.createQuery(
        """
        select a.id from QuizAttempt a
        where a.deleted = false and a.id > :afterId and a.status = :status and a.expiresAt < :cutoff
        order by a.id
        """.trimIndent(),
        java.lang.Long::class.java,
    ).setParameter("afterId", afterId)
        .setParameter("status", QuizAttemptStatus.IN_PROGRESS)
        .setParameter("cutoff", now.minus(CLOSE_AFTER))
        .setMaxResults(BATCH).resultList.map { it.toLong() }

    /** Bitta urinishni qulf bilan qayta tekshirib yopadi; yopilgan bo'lsa true. */
    @Transactional
    fun close(attemptId: Long, now: Instant = Instant.now()): Boolean {
        val attempt = em.find(QuizAttempt::class.java, attemptId, LockModeType.PESSIMISTIC_WRITE) ?: return false
        if (attempt.deleted || attempt.status != QuizAttemptStatus.IN_PROGRESS) return false
        if (!attempt.expiresAt.plus(CLOSE_AFTER).isBefore(now)) return false
        quizService.closeExpiredAttempt(attempt)
        return true
    }
}

@Component
class QuizAttemptExpiryWorker(private val service: QuizAttemptExpiryService) {
    private val logger = KotlinLogging.logger {}

    @Scheduled(fixedDelay = 60_000, initialDelay = 90_000)
    fun run() {
        val now = Instant.now()
        var after = 0L
        var closed = 0
        while (true) {
            val ids = service.expiredIds(after, now)
            if (ids.isEmpty()) break
            ids.forEach { id ->
                runCatching { if (service.close(id, now)) closed++ }
                    .onFailure { logger.warn(it) { "Muddati o'tgan test urinishi yopilmadi: attempt=$id" } }
            }
            after = ids.last()
        }
        if (closed > 0) logger.info { "Muddati o'tgan $closed ta test urinishi yopildi" }
    }
}
