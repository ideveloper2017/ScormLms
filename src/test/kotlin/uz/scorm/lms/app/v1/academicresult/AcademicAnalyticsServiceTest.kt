package uz.scorm.lms.app.v1.academicresult

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.academicresult.service.AcademicAnalyticsService
import uz.scorm.lms.app.v1.assignment.repository.AssignmentSubmissionRepository
import uz.scorm.lms.app.v1.assignment.repository.CourseAssignmentRepository
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseModuleRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.exam.model.ExamResult
import uz.scorm.lms.app.v1.exam.model.ExamSession
import uz.scorm.lms.app.v1.exam.model.ExamSessionStatus
import uz.scorm.lms.app.v1.exam.repository.ExamResultRepository
import uz.scorm.lms.app.v1.exam.repository.ExamSessionRepository
import uz.scorm.lms.app.v1.group.repository.GroupRepository
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.quiz.model.CourseQuiz
import uz.scorm.lms.app.v1.quiz.model.QuizAttempt
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizAnswerRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizAttemptRepository
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

class AcademicAnalyticsServiceTest {
    private val enrollmentRepo = mockk<CourseEnrollmentRepository>(relaxed = true)
    private val sessionRepo = mockk<ExamSessionRepository>(relaxed = true)
    private val resultRepo = mockk<ExamResultRepository>(relaxed = true)
    private val attemptRepo = mockk<QuizAttemptRepository>(relaxed = true)
    private val answerRepo = mockk<QuizAnswerRepository>(relaxed = true)
    private val courseRepo = mockk<CourseRepository>(relaxed = true)
    private val moduleRepo = mockk<CourseModuleRepository>(relaxed = true)
    private val contentRepo = mockk<CourseContentRepository>(relaxed = true)
    private val assignmentRepo = mockk<CourseAssignmentRepository>(relaxed = true)
    private val quizRepo = mockk<CourseQuizRepository>(relaxed = true)
    private val submissionRepo = mockk<AssignmentSubmissionRepository>(relaxed = true)
    private val studentRepo = mockk<StudentRepository>(relaxed = true)
    private val programRepo = mockk<ProgramRepository>(relaxed = true)
    private val groupRepo = mockk<GroupRepository>(relaxed = true)
    private val userRepo = mockk<UserRepository>(relaxed = true)
    private val service = AcademicAnalyticsService(
        enrollmentRepo, sessionRepo, resultRepo, attemptRepo, answerRepo, courseRepo,
        moduleRepo, contentRepo, assignmentRepo, quizRepo, submissionRepo, studentRepo,
        programRepo, groupRepo, userRepo,
    )

    @Test
    fun `oraliq va yakuniy natijadan umumiy ball baho va gpa hisoblanadi`() {
        val fixture = fixture()
        every { enrollmentRepo.findAllByDeletedFalseOrderByAcademicYearDescSemesterDescEnrolledAtDesc() } returns listOf(fixture.enrollment)
        every { resultRepo.findAllByDeletedFalseOrderByGradingDateDesc() } returns listOf(fixture.result)
        every { attemptRepo.findAllByDeletedFalseOrderByStartedAtDesc() } returns listOf(fixture.attempt)

        val row = service.studentResults().single()

        assertEquals(80.0, row.interimScore)
        assertEquals(70.0, row.finalScore)
        assertEquals(75.0, row.totalScore)
        assertEquals(4, row.mark)
        assertEquals(3.0, row.gpaPoint)
        assertTrue(row.passed)
        assertEquals(3.0, service.gpa().single().gpa)
    }

    @Test
    fun `yakunlangan nazorat yakuniy vedmostga aylanadi`() {
        val fixture = fixture()
        every { enrollmentRepo.findAllByDeletedFalseOrderByAcademicYearDescSemesterDescEnrolledAtDesc() } returns listOf(fixture.enrollment)
        every { resultRepo.findAllByDeletedFalseOrderByGradingDateDesc() } returns listOf(fixture.result)
        every { sessionRepo.findAllByDeletedFalseOrderByExamDateDesc() } returns listOf(fixture.session)

        val statement = service.statements(finalStatement = true).single()

        assertTrue(statement.finalStatement)
        assertEquals(1, statement.resultCount)
        assertEquals(1, statement.passedCount)
        assertEquals(70.0, statement.averageScore)
    }

    private fun fixture(): Fixture {
        val teacher = User(fullName = "O'qituvchi", username = "teacher", password = "hash").apply { id = 1 }
        val studentUser = User(fullName = "Ali Valiyev", username = "student", password = "hash").apply { id = 2 }
        val student = StudentProfile(
            user = studentUser,
            pinfl = "12345678901234",
            lastName = "Valiyev",
            firstName = "Ali",
            birthDate = LocalDate.of(2005, 1, 1),
            gender = Gender.MALE,
            studentNumber = "ST-001",
        ).apply { id = 3 }
        val course = Course(title = "Matematika", subjectName = "Matematika", groupName = "101-guruh").apply { id = 4 }
        val enrollment = CourseEnrollment(course, student, academicYear = "2025-2026", semester = 2, credits = 5).apply { id = 5 }
        val session = ExamSession(
            course = course,
            title = "Yakuniy nazorat",
            examDate = LocalDate.of(2026, 6, 1),
            examTime = LocalTime.NOON,
            location = "A-101",
            examiner = teacher,
            status = ExamSessionStatus.COMPLETED,
        ).apply { id = 6 }
        val result = ExamResult(
            examSession = session,
            enrollment = enrollment,
            score = BigDecimal("70"),
            percentage = 70.0,
            passed = true,
            grade = "C",
            gradedBy = teacher,
            gradingDate = Instant.parse("2026-06-01T12:00:00Z"),
        ).apply { id = 7 }
        val quiz = CourseQuiz(
            course = course,
            title = "Oraliq nazorat",
            opensAt = Instant.parse("2026-05-01T09:00:00Z"),
            closesAt = Instant.parse("2026-05-01T10:00:00Z"),
            durationMinutes = 60,
        ).apply { id = 8 }
        val attempt = QuizAttempt(
            quiz = quiz,
            enrollment = enrollment,
            attemptNumber = 1,
            startedAt = Instant.parse("2026-05-01T09:00:00Z"),
            expiresAt = Instant.parse("2026-05-01T10:00:00Z"),
            submittedAt = Instant.parse("2026-05-01T09:30:00Z"),
            status = QuizAttemptStatus.SUBMITTED,
            questionOrder = "[]",
            score = 80,
            totalPoints = 100,
            percentage = 80.0,
            passed = true,
        ).apply { id = 9 }
        return Fixture(enrollment, session, result, attempt)
    }

    private data class Fixture(
        val enrollment: CourseEnrollment,
        val session: ExamSession,
        val result: ExamResult,
        val attempt: QuizAttempt,
    )
}
