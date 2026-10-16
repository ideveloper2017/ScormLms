package uz.scorm.lms.app.v1.quiz

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import jakarta.persistence.EntityManager
import jakarta.persistence.LockModeType
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.quiz.model.QuizAttempt
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
import uz.scorm.lms.app.v1.quiz.service.QuizAttemptExpiryService
import uz.scorm.lms.app.v1.quiz.service.QuizService
import java.time.Instant

class QuizAttemptExpiryServiceTest {
    private val em = mockk<EntityManager>()
    private val quizService = mockk<QuizService>(relaxed = true)
    private val service = QuizAttemptExpiryService(em, quizService)
    private val now = Instant.parse("2026-10-16T12:00:00Z")

    private fun attempt(expiresAt: Instant, status: QuizAttemptStatus = QuizAttemptStatus.IN_PROGRESS): QuizAttempt {
        val attempt = mockk<QuizAttempt>(relaxed = true)
        every { attempt.expiresAt } returns expiresAt
        every { attempt.status } returns status
        every { attempt.deleted } returns false
        every { em.find(QuizAttempt::class.java, 5L, LockModeType.PESSIMISTIC_WRITE) } returns attempt
        return attempt
    }

    @Test
    fun `tashlab ketilgan urinish muddatdan keyin yopiladi va bahoga tushadi`() {
        val abandoned = attempt(now.minusSeconds(600))
        assertTrue(service.close(5L, now))
        verify { quizService.closeExpiredAttempt(abandoned) }
    }

    @Test
    fun `javob qabul qilish oynasi ichidagi urinishga tegilmaydi`() {
        attempt(now.minusSeconds(45))
        assertFalse(service.close(5L, now))
        verify(exactly = 0) { quizService.closeExpiredAttempt(any()) }
    }

    @Test
    fun `allaqachon yakunlangan urinish qayta yopilmaydi`() {
        attempt(now.minusSeconds(600), QuizAttemptStatus.SUBMITTED)
        assertFalse(service.close(5L, now))
        verify(exactly = 0) { quizService.closeExpiredAttempt(any()) }
    }
}
