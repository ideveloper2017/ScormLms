package uz.scorm.lms.app.v1.quiz

import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.quiz.model.CourseQuiz
import uz.scorm.lms.app.v1.quiz.model.QuizAttempt
import uz.scorm.lms.app.v1.quiz.model.QuizQuestion
import uz.scorm.lms.app.v1.quiz.model.QuizQuestionType
import uz.scorm.lms.app.v1.quiz.service.QuizService
import java.time.Instant

class QuizAnswerNormalizationTest {
    private val service = QuizService(
        mockk(relaxed = true), mockk(relaxed = true), mockk(relaxed = true), mockk(relaxed = true),
        mockk(relaxed = true), mockk(relaxed = true), mockk(relaxed = true), mockk(relaxed = true),
        mockk(relaxed = true), mockk(relaxed = true), mockk(relaxed = true), mockk(relaxed = true),
    )

    @Test
    fun `o'zbek apostrof variantlari va bo'shliqlar javobni noto'g'ri qilmaydi`() {
        val key = service.normalized("O'zbekiston")
        listOf("o‘zbekiston", "Oʻzbekiston", "o’zbekiston", "o`zbekiston", "  O'ZBEKISTON ").forEach {
            assertEquals(key, service.normalized(it), it)
        }
        assertEquals(service.normalized("g'alaba qozondi"), service.normalized("gʻalaba   qozondi"))
        assertNotEquals(key, service.normalized("ozbekiston"))
    }

    @Test
    fun `qisqa javobda o'qituvchi bergan har qanday variant to'g'ri, boshqa turda | oddiy belgi`() {
        val course = Course(title = "Fizika").apply { id = 1 }
        val short = QuizQuestion(course = course, text = "F = ?", type = QuizQuestionType.SHORT_ANSWER, correctAnswer = "6 N|6N| 6 nyuton ")
        listOf("6 N", "6n", "6 Nyuton").forEach { assertTrue(service.isCorrect(short, it), it) }
        assertFalse(service.isCorrect(short, "7 N"))
        assertFalse(service.isCorrect(short, "   "))

        val choice = QuizQuestion(course = course, text = "?", type = QuizQuestionType.SINGLE_CHOICE, correctAnswer = "A|B")
        assertTrue(service.isCorrect(choice, "A|B"))
        assertFalse(service.isCorrect(choice, "A"))
    }

    @Test
    fun `javob variantlari har urinishda o'z tartibida, sahifa yangilansa o'zgarmaydi`() {
        val course = Course(title = "Fizika").apply { id = 1 }
        val quiz = CourseQuiz(course = course, title = "T", opensAt = Instant.EPOCH, closesAt = Instant.now(), durationMinutes = 10)
            .apply { id = 2 }
        val question = QuizQuestion(course = course, text = "?", type = QuizQuestionType.SINGLE_CHOICE, correctAnswer = "A")
            .apply { id = 3 }
        val options = listOf("A", "B", "C", "D", "E", "F")
        val orders = (1L..20L).map { attemptId ->
            val attempt = QuizAttempt(quiz = quiz, enrollment = mockk(relaxed = true), attemptNumber = 1,
                startedAt = Instant.EPOCH, expiresAt = Instant.now(), questionOrder = "").apply { id = attemptId }
            val order = service.optionOrder(options, attempt, question)
            assertEquals(order, service.optionOrder(options, attempt, question))
            assertEquals(options.toSet(), order.toSet())
            order
        }
        // 20 ta urinishning hammasi bir xil tartibni olmasligi kerak.
        assert(orders.toSet().size > 1)
    }
}
