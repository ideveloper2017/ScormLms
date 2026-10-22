package uz.scorm.lms.app.v1.quiz

import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.face.service.FaceDetectionException
import uz.scorm.lms.app.v1.face.service.FaceFrameAnalysis
import uz.scorm.lms.app.v1.face.service.FaceService
import uz.scorm.lms.app.v1.face.service.FaceTemplate
import uz.scorm.lms.app.v1.quiz.model.CourseQuiz
import uz.scorm.lms.app.v1.quiz.model.ProctoringChallengeDirection
import uz.scorm.lms.app.v1.quiz.model.ProctoringEvent
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventSeverity
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventSource
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventType
import uz.scorm.lms.app.v1.quiz.model.ProctoringSession
import uz.scorm.lms.app.v1.quiz.model.QuizAttempt
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
import uz.scorm.lms.app.v1.quiz.repository.ProctoringEventRepository
import uz.scorm.lms.app.v1.quiz.repository.ProctoringSessionRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizAttemptRepository
import uz.scorm.lms.app.v1.quiz.service.ProctoringIdentityCheckService
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant
import java.time.LocalDate

class ProctoringIdentityCheckServiceTest {
    private val attempts = mockk<QuizAttemptRepository>()
    private val sessions = mockk<ProctoringSessionRepository>()
    private val events = mockk<ProctoringEventRepository>()
    private val face = mockk<FaceService>()
    private val service = ProctoringIdentityCheckService(attempts, sessions, events, face)

    private val now = Instant.parse("2026-10-16T10:10:00Z")
    private val registered = FaceTemplate.encode(FloatArray(FaceTemplate.DIMENSIONS) { (it % 5).toFloat() })
    private val frame = ByteArray(4_096) { 7 }
    private val saved = slot<ProctoringEvent>()
    private lateinit var attempt: QuizAttempt

    @BeforeEach
    fun setUp() {
        val course = Course(title = "Fizika").apply { id = 1 }
        val quiz = CourseQuiz(course = course, title = "Yakuniy", opensAt = now.minusSeconds(3600),
            closesAt = now.plusSeconds(3600), durationMinutes = 60, proctoring = true).apply { id = 2 }
        val user = User(username = "s", password = "x", fullName = "Ali").apply { id = 9; faceDescriptor = registered }
        val student = StudentProfile(user = user, pinfl = "12345678901234", lastName = "V", firstName = "Ali",
            birthDate = LocalDate.of(2005, 1, 1), gender = Gender.MALE, studentNumber = "ST-1").apply { id = 3 }
        val enrollment = CourseEnrollment(course, student, academicYear = "2026-2027", semester = 1, credits = 5).apply { id = 4 }
        attempt = QuizAttempt(quiz = quiz, enrollment = enrollment, attemptNumber = 1, startedAt = now.minusSeconds(600),
            expiresAt = now.plusSeconds(1800), questionOrder = "").apply { id = 5 }
        val session = ProctoringSession(quiz = quiz, enrollment = enrollment, challengeDirection = ProctoringChallengeDirection.LEFT,
            nonceHash = "x", expiresAt = now).apply { id = 6 }
        every { attempts.findByIdAndDeletedFalse(5) } returns attempt
        every { sessions.findFirstByAttemptIdAndDeletedFalse(5) } returns session
        every { events.findFirstByAttemptIdAndTypeInAndDeletedFalseOrderByOccurredAtDesc(5, any()) } returns null
        every { events.save(capture(saved)) } answers { saved.captured }
        every { face.matchThreshold } returns 0.363
        every { face.analyzeFrame(frame) } returns FaceFrameAnalysis("current-frame", 0.5)
    }

    @Test
    fun `o'sha talaba - tasdiq hodisasi, server manbali, maslahatsiz`() {
        every { face.templateSimilarity(registered, "current-frame") } returns 0.81

        val result = service.check(2, 5, 9, frame, now)

        assertTrue(result.recorded)
        assertNull(result.hint)
        assertTrue(result.nextCheckInSeconds in 120..240)
        assertEquals(ProctoringEventType.IDENTITY_VERIFIED, saved.captured.type)
        assertEquals(ProctoringEventSource.SERVER, saved.captured.source)
        assertEquals(ProctoringEventSeverity.INFO, saved.captured.severity)
    }

    @Test
    fun `boshqa odam - yuqori darajali signal, lekin talabaga oshkor qilinmaydi`() {
        every { face.templateSimilarity(registered, "current-frame") } returns 0.12

        val result = service.check(2, 5, 9, frame, now)

        assertNull(result.hint)
        assertEquals(ProctoringEventType.IDENTITY_MISMATCH, saved.captured.type)
        assertEquals(ProctoringEventSeverity.HIGH, saved.captured.severity)
    }

    @Test
    fun `yuz ko'rinmasa yoki bir nechta yuz bo'lsa - talabaga yordamchi maslahat`() {
        every { face.analyzeFrame(frame) } throws FaceDetectionException(FaceDetectionException.Reason.NO_FACE, "yo'q")
        assertEquals("Yuzingiz kamerada to'liq va yorug' ko'rinsin", service.check(2, 5, 9, frame, now).hint)
        assertEquals(ProctoringEventType.IDENTITY_FACE_NOT_FOUND, saved.captured.type)

        every { face.analyzeFrame(frame) } throws FaceDetectionException(FaceDetectionException.Reason.MULTIPLE_FACES, "ko'p")
        service.check(2, 5, 9, frame, now)
        assertEquals(ProctoringEventType.IDENTITY_MULTIPLE_FACES, saved.captured.type)
        assertEquals(ProctoringEventSeverity.HIGH, saved.captured.severity)
    }

    @Test
    fun `60 soniyadan tez-tez yuborilgan kadr tahlil qilinmaydi va yozilmaydi`() {
        val previous = mockk<ProctoringEvent>()
        every { previous.occurredAt } returns now.minusSeconds(20)
        every { events.findFirstByAttemptIdAndTypeInAndDeletedFalseOrderByOccurredAtDesc(5, any()) } returns previous

        val result = service.check(2, 5, 9, frame, now)

        assertFalse(result.recorded)
        verify(exactly = 0) { face.analyzeFrame(any()) }
        verify(exactly = 0) { events.save(any()) }
    }

    @Test
    fun `begona urinish, yakunlangan urinish va proktoringsiz test rad etiladi`() {
        assertThrows(IllegalArgumentException::class.java) { service.check(2, 5, 99, frame, now) }
        attempt.status = QuizAttemptStatus.SUBMITTED
        assertThrows(IllegalArgumentException::class.java) { service.check(2, 5, 9, frame, now) }
        attempt.status = QuizAttemptStatus.IN_PROGRESS
        attempt.quiz.proctoring = false
        assertThrows(IllegalArgumentException::class.java) { service.check(2, 5, 9, frame, now) }
    }
}
