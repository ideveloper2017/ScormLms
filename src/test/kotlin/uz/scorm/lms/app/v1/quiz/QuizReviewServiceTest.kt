package uz.scorm.lms.app.v1.quiz

import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.quiz.dto.AnswerKeyRequest
import uz.scorm.lms.app.v1.quiz.dto.ManualGradeRequest
import uz.scorm.lms.app.v1.quiz.model.CourseQuiz
import uz.scorm.lms.app.v1.quiz.model.CourseQuizQuestion
import uz.scorm.lms.app.v1.quiz.model.QuizAnswer
import uz.scorm.lms.app.v1.quiz.model.QuizAttempt
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
import uz.scorm.lms.app.v1.quiz.model.QuizQuestion
import uz.scorm.lms.app.v1.quiz.model.QuizQuestionType
import uz.scorm.lms.app.v1.quiz.model.QuizStatus
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizQuestionRepository
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizAnswerRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizAttemptRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizQuestionRepository
import uz.scorm.lms.app.v1.quiz.service.QuizReviewService
import uz.scorm.lms.app.v1.quiz.service.QuizService
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant
import java.time.LocalDate

class QuizReviewServiceTest {
    private val quizService = mockk<QuizService>(relaxed = true)
    private val questions = mockk<QuizQuestionRepository>(relaxed = true)
    private val quizzes = mockk<CourseQuizRepository>(relaxed = true)
    private val links = mockk<CourseQuizQuestionRepository>(relaxed = true)
    private val attempts = mockk<QuizAttemptRepository>(relaxed = true)
    private val answers = mockk<QuizAnswerRepository>(relaxed = true)
    private val enrollments = mockk<CourseEnrollmentRepository>(relaxed = true)
    private val audit = mockk<AuditService>(relaxed = true)
    private val service = QuizReviewService(
        quizService, questions, quizzes, links, attempts, answers, enrollments, mockk<CourseAccessService>(relaxed = true), audit,
    )

    private val course = Course(title = "Fizika").apply { id = 1 }
    private val quiz = CourseQuiz(course = course, title = "Oraliq", opensAt = Instant.now().minusSeconds(7200),
        closesAt = Instant.now().plusSeconds(3600), durationMinutes = 30, status = QuizStatus.PUBLISHED).apply { id = 2 }
    private val question = QuizQuestion(course = course, text = "F = m × a, 2 × 3 = ?", type = QuizQuestionType.SHORT_ANSWER,
        points = 5, correctAnswer = "5").apply { id = 3 }
    private val student = StudentProfile(user = User(username = "s", password = "x", fullName = "Ali").apply { id = 9 },
        pinfl = "12345678901234", lastName = "Valiyev", firstName = "Ali", birthDate = LocalDate.of(2005, 1, 1),
        gender = Gender.MALE, studentNumber = "ST-1").apply { id = 4 }
    private val enrollment = CourseEnrollment(course, student, academicYear = "2026-2027", semester = 1, credits = 5).apply { id = 5 }

    private fun attempt(id: Long, status: QuizAttemptStatus = QuizAttemptStatus.SUBMITTED) = QuizAttempt(
        quiz = quiz, enrollment = enrollment, attemptNumber = id.toInt(), startedAt = Instant.now().minusSeconds(3000),
        expiresAt = Instant.now().minusSeconds(1200), status = status, questionOrder = "3",
    ).apply { this.id = id }

    @Test
    fun `noto'g'ri kalit tuzatilganda avtomatik javoblar qayta baholanadi, qo'lda qo'yilgan ball saqlanadi`() {
        val a1 = attempt(10)
        val a2 = attempt(11)
        val auto = QuizAnswer(a1, question, "6").apply { id = 100; correct = false; awardedPoints = 0 }
        val manual = QuizAnswer(a2, question, "olti").apply { id = 101; correct = true; awardedPoints = 5; manuallyGraded = true }
        every { questions.findByIdAndDeletedFalse(3) } returns question
        every { questions.save(any()) } answers { firstArg() }
        every { quizService.optionsOf(question) } returns emptyList()
        every { quizService.isCorrect(question, "6") } returns true
        every { answers.findAllByQuestionIdAndDeletedFalse(3) } returns listOf(auto, manual)
        every { links.findAllByQuestionIdAndDeletedFalse(3) } returns listOf(CourseQuizQuestion(quiz, question, 1))
        every { attempts.findAllByQuizIdAndDeletedFalseOrderByStartedAtDesc(2) } returns listOf(a1, a2, attempt(12, QuizAttemptStatus.IN_PROGRESS))
        every { quizService.questionsOf(any()) } returns listOf(question)
        every { quizService.recalculateAndSave(a1) } answers { a1.apply { percentage = 100.0 } }
        every { quizService.recalculateAndSave(a2) } answers { a2 }

        val result = service.updateAnswerKey(3, AnswerKeyRequest(correctAnswer = "6", points = 4), userId = 7, mayManageAll = false)

        assertEquals("6", question.correctAnswer)
        assertEquals(4, question.points)
        assertTrue(auto.correct)
        assertEquals(4, auto.awardedPoints)
        assertEquals(4, manual.awardedPoints) // qo'lda qo'yilgan 5 — yangi maksimal 4 dan oshmaydi
        assertTrue(manual.manuallyGraded)
        assertEquals(1, result.answersRegraded)
        assertEquals(1, result.manualAnswersKept)
        assertEquals(2, result.attemptsRecalculated) // davom etayotgan urinish yakunda hisoblanadi
        assertEquals(1, result.scoresChanged)
        verify { audit.logAction("QUIZ_ANSWER_KEY_CORRECTED", 7, any()) }
    }

    @Test
    fun `o'qituvchi javobga qo'lda ball qo'yadi, chegaradan tashqari va yakunlanmagan urinish rad etiladi`() {
        val finished = attempt(10)
        every { attempts.findByIdAndDeletedFalse(10) } returns finished
        every { attempts.findByIdAndDeletedFalse(12) } returns attempt(12, QuizAttemptStatus.IN_PROGRESS)
        every { quizService.questionsOf(any()) } returns listOf(question)
        every { answers.findByAttemptIdAndQuestionIdAndDeletedFalse(10, 3) } returns null
        val saved = slot<QuizAnswer>()
        every { answers.save(capture(saved)) } answers { saved.captured }

        assertThrows(IllegalArgumentException::class.java) { service.gradeAnswer(2, 10, 3, ManualGradeRequest(6), 7, false) }
        assertThrows(IllegalArgumentException::class.java) { service.gradeAnswer(2, 12, 3, ManualGradeRequest(3), 7, false) }

        service.gradeAnswer(2, 10, 3, ManualGradeRequest(3, "Birlik yozilmagan, yechim to'g'ri"), 7, false)

        assertEquals(3, saved.captured.awardedPoints)
        assertFalse(saved.captured.correct)
        assertTrue(saved.captured.manuallyGraded)
        assertEquals(7L, saved.captured.gradedById)
        assertEquals("Birlik yozilmagan, yechim to'g'ri", saved.captured.graderComment)
        verify { quizService.recalculateAndSave(finished) }
    }

    @Test
    fun `talaba javoblar tahlilini test tugaguncha ko'rmaydi`() {
        every { quizzes.findByIdAndDeletedFalse(2) } returns quiz
        every { enrollments.findByCourseIdAndStudentUserIdAndStatusInAndDeletedFalse(1, 9, any()) } returns enrollment
        every { attempts.findAllByQuizIdAndEnrollmentIdAndDeletedFalseOrderByAttemptNumberDesc(2, 5) } returns listOf(attempt(10))
        every { quizService.questionsOf(any()) } returns listOf(question)

        assertThrows(IllegalArgumentException::class.java) { service.studentReview(2, 9, null) }

        quiz.status = QuizStatus.CLOSED
        val review = service.studentReview(2, 9, null)
        assertEquals("5", review.items.single().correctAnswer)
    }
}
