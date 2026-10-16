package uz.scorm.lms.app.v1.exam

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.academicresult.service.AcademicPassingPolicy
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.exam.dto.ExamAppealRequestDto
import uz.scorm.lms.app.v1.exam.dto.ReviewExamAppealRequest
import uz.scorm.lms.app.v1.exam.model.AppealStatus
import uz.scorm.lms.app.v1.exam.model.ExamAppeal
import uz.scorm.lms.app.v1.exam.model.ExamResult
import uz.scorm.lms.app.v1.exam.model.ExamSession
import uz.scorm.lms.app.v1.exam.model.ExamSessionStatus
import uz.scorm.lms.app.v1.exam.repository.ExamAppealRepository
import uz.scorm.lms.app.v1.exam.repository.ExamResultRepository
import uz.scorm.lms.app.v1.exam.repository.ExamSessionRepository
import uz.scorm.lms.app.v1.exam.service.ExamResultService
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.temporal.ChronoUnit
import java.util.Optional

class ExamAppealPolicyTest {
    private val sessions = mockk<ExamSessionRepository>(relaxed = true)
    private val results = mockk<ExamResultRepository>(relaxed = true)
    private val appeals = mockk<ExamAppealRepository>(relaxed = true)
    private val users = mockk<UserRepository>(relaxed = true)
    private val service = ExamResultService(
        sessions, mockk(relaxed = true), results, appeals, mockk(relaxed = true), users,
        mockk(relaxed = true), mockk(relaxed = true), AcademicPassingPolicy(mockk(relaxed = true)),
    )

    private val grader = User(username = "grader", password = "x", fullName = "Baholovchi").apply { id = 1 }
    private val reviewer = User(username = "reviewer", password = "x", fullName = "Komissiya").apply { id = 2 }
    private val studentUser = User(username = "student", password = "x", fullName = "Ali").apply { id = 3 }

    private fun result(gradedAt: Instant, heldAt: Instant?): ExamResult {
        val course = Course(title = "Fizika").apply { id = 10 }
        val student = StudentProfile(user = studentUser, pinfl = "12345678901234", lastName = "Valiyev", firstName = "Ali",
            birthDate = LocalDate.of(2005, 1, 1), gender = Gender.MALE, studentNumber = "ST-1").apply { id = 4 }
        val session = ExamSession(course = course, title = "Yakuniy", examDate = LocalDate.of(2026, 9, 1),
            examTime = LocalTime.NOON, location = "A", examiner = grader, status = ExamSessionStatus.COMPLETED)
            .apply { id = 20; this.heldAt = heldAt }
        val enrollment = CourseEnrollment(course, student, academicYear = "2026-2027", semester = 1, credits = 5).apply { id = 30 }
        return ExamResult(examSession = session, enrollment = enrollment, score = BigDecimal("50"), percentage = 50.0,
            gradedBy = grader, gradingDate = gradedAt).apply { id = 40 }
    }

    @Test
    fun `apellyatsiya muddati natija e'lon qilingan kundan sanaladi`() {
        val now = Instant.now()
        // Ball 20 kun oldin kiritilgan, sessiya esa 2 kun oldin yopilib natija e'lon qilingan.
        val result = result(gradedAt = now.minus(20, ChronoUnit.DAYS), heldAt = now.minus(2, ChronoUnit.DAYS))
        every { results.findByIdAndDeletedFalse(40) } returns result
        every { users.findById(3) } returns Optional.of(studentUser)
        every { appeals.save(any()) } answers { firstArg<ExamAppeal>().apply { id = 50 } }

        val appeal = service.appeal(ExamAppealRequestDto(40, "Yozma ishimni qayta tekshirishni so'rayman"), 3)

        assertEquals("PENDING", appeal.status)
    }

    @Test
    fun `e'londan 10 kun o'tgach apellyatsiya qabul qilinmaydi`() {
        val now = Instant.now()
        val result = result(gradedAt = now.minus(20, ChronoUnit.DAYS), heldAt = now.minus(11, ChronoUnit.DAYS))
        every { results.findByIdAndDeletedFalse(40) } returns result

        assertThrows(IllegalArgumentException::class.java) {
            service.appeal(ExamAppealRequestDto(40, "Yozma ishimni qayta tekshirishni so'rayman"), 3)
        }
    }

    @Test
    fun `bahoni qo'ygan xodim o'z bahosiga berilgan apellyatsiyani hal qila olmaydi, boshqasi hal qiladi`() {
        val result = result(gradedAt = Instant.now(), heldAt = Instant.now())
        val appeal = ExamAppeal(result, studentUser, Instant.now(), "Yozma ishimni qayta tekshiring").apply { id = 50 }
        every { appeals.findByIdAndDeletedFalse(50) } returns appeal
        every { sessions.findByIdAndDeletedFalse(20) } returns result.examSession
        every { users.findById(2) } returns Optional.of(reviewer)
        every { appeals.save(any()) } answers { firstArg() }
        every { results.save(any()) } answers { firstArg() }
        val request = ReviewExamAppealRequest(AppealStatus.APPROVED, "Qayta tekshirildi", BigDecimal("85"))

        assertThrows(IllegalArgumentException::class.java) { service.reviewAppeal(50, request, 1, true) }

        val reviewed = service.reviewAppeal(50, request, 2, true)
        assertEquals("APPROVED", reviewed.status)
        // Yagona shkala: 85 → B+ (avval imtihon o'zining A/B/C/D jadvalida "B" berardi).
        assertEquals("B+", result.grade)
    }
}
