package uz.scorm.lms.app.v1.academicresult

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.academicresult.service.CourseScorePolicy
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.exam.model.ExamResult
import uz.scorm.lms.app.v1.exam.model.ExamSession
import uz.scorm.lms.app.v1.exam.model.ExamSessionStatus
import uz.scorm.lms.app.v1.quiz.model.CourseQuiz
import uz.scorm.lms.app.v1.quiz.model.QuizAttempt
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
import uz.scorm.lms.app.v1.quiz.model.QuizStatus
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.user.model.User
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

class CourseScorePolicyTest {
    private val now = Instant.parse("2026-10-16T12:00:00Z")
    private val course = Course(title = "Fizika").apply { id = 1 }
    private val enrollment = CourseEnrollment(course, student(), academicYear = "2026-2027", semester = 1, credits = 5)
        .apply { id = 10; enrolledAt = Instant.parse("2026-09-01T00:00:00Z") }

    @Test
    fun `qayta urinishlar o'rtachaga qo'shilmaydi - har test uchun eng yuqori urinish olinadi`() {
        val quiz = quiz(100, closesAt = now.minusSeconds(3600))
        val best = CourseScorePolicy.bestAttempts(listOf(
            attempt(quiz, 1, 40.0), attempt(quiz, 2, 90.0), attempt(quiz, 3, 60.0),
            attempt(quiz, 4, 99.0, QuizAttemptStatus.IN_PROGRESS),
        ))
        assertEquals(listOf(90.0), best.map { it.percentage })
    }

    @Test
    fun `tugagan testni topshirmagan talaba 0 oladi va bu o'rtachani pasaytiradi`() {
        val taken = quiz(100, closesAt = now.minusSeconds(3600))
        val skipped = quiz(101, closesAt = now.minusSeconds(3600))
        val stillOpen = quiz(102, closesAt = now.plusSeconds(3600))
        val draft = quiz(103, closesAt = now.minusSeconds(3600), status = QuizStatus.DRAFT)
        val closedEarly = quiz(104, closesAt = now.plusSeconds(3600), status = QuizStatus.CLOSED)
        val beforeEnrollment = quiz(105, closesAt = Instant.parse("2026-08-01T00:00:00Z"))

        val missed = CourseScorePolicy.missedQuizzes(
            enrollment, listOf(taken, skipped, stillOpen, draft, closedEarly, beforeEnrollment), setOf(100L), now,
        )

        assertEquals(listOf(101L, 104L), missed.map { it.id })
        assertEquals(30.0, CourseScorePolicy.interim(listOf(90.0), missed.size))
        assertNull(CourseScorePolicy.interim(emptyList(), 0))
    }

    @Test
    fun `yakuniy natija faqat yakunlangan sessiyadan va eng oxirgi baholangani`() {
        val examiner = User(username = "t", password = "x", fullName = "T").apply { id = 7 }
        fun result(id: Long, status: ExamSessionStatus, percentage: Double, gradedAt: String) = ExamResult(
            examSession = ExamSession(course = course, title = "Yakuniy", examDate = LocalDate.of(2026, 10, 1),
                examTime = LocalTime.NOON, location = "A", examiner = examiner, status = status),
            enrollment = enrollment, score = BigDecimal(percentage), percentage = percentage,
            gradedBy = examiner, gradingDate = Instant.parse(gradedAt),
        ).apply { this.id = id }

        val first = result(1, ExamSessionStatus.COMPLETED, 40.0, "2026-10-01T10:00:00Z")
        val retake = result(2, ExamSessionStatus.COMPLETED, 75.0, "2026-10-10T10:00:00Z")
        val ongoing = result(3, ExamSessionStatus.ONGOING, 99.0, "2026-10-15T10:00:00Z")

        assertEquals(2L, CourseScorePolicy.finalExam(listOf(first, retake, ongoing))?.id)
        assertNull(CourseScorePolicy.finalExam(listOf(ongoing)))
    }

    private fun quiz(id: Long, closesAt: Instant, status: QuizStatus = QuizStatus.PUBLISHED) = CourseQuiz(
        course = course, title = "Test $id", opensAt = closesAt.minusSeconds(7200), closesAt = closesAt,
        durationMinutes = 30, status = status,
    ).apply { this.id = id }

    private fun attempt(quiz: CourseQuiz, number: Int, percentage: Double, status: QuizAttemptStatus = QuizAttemptStatus.SUBMITTED) =
        QuizAttempt(
            quiz = quiz, enrollment = enrollment, attemptNumber = number,
            startedAt = now.minusSeconds(7000), expiresAt = now.minusSeconds(5200), status = status,
            questionOrder = "", percentage = percentage,
        ).apply { id = quiz.id!! * 10 + number }

    private fun student() = StudentProfile(
        user = User(username = "s", password = "x", fullName = "Ali").apply { id = 2 },
        pinfl = "12345678901234", lastName = "Valiyev", firstName = "Ali",
        birthDate = LocalDate.of(2005, 1, 1), gender = Gender.MALE, studentNumber = "ST-1",
    ).apply { id = 3 }
}
