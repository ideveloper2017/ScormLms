package uz.scorm.lms.app.v1.quiz

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.biometric.service.BiometricGovernanceService
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.face.service.FaceFrameAnalysis
import uz.scorm.lms.app.v1.face.service.FaceService
import uz.scorm.lms.app.v1.quiz.model.CourseQuiz
import uz.scorm.lms.app.v1.quiz.model.ProctoringChallengeDirection
import uz.scorm.lms.app.v1.quiz.model.ProctoringSession
import uz.scorm.lms.app.v1.quiz.model.ProctoringSessionStatus
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizRepository
import uz.scorm.lms.app.v1.quiz.repository.ProctoringSessionRepository
import uz.scorm.lms.app.v1.quiz.repository.ProctoringEventRepository
import uz.scorm.lms.app.v1.quiz.service.ProctoringService
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.user.model.User
import java.security.MessageDigest
import java.time.Instant

class ProctoringServiceTest {
    private val quizRepository = mockk<CourseQuizRepository>()
    private val enrollmentRepository = mockk<CourseEnrollmentRepository>()
    private val sessionRepository = mockk<ProctoringSessionRepository>()
    private val faceService = mockk<FaceService>()
    private val eventRepository = mockk<ProctoringEventRepository>(relaxed = true)
    private val biometricGovernanceService = mockk<BiometricGovernanceService>(relaxed = true)
    private lateinit var service: ProctoringService

    @BeforeEach
    fun setUp() {
        service = ProctoringService(quizRepository, enrollmentRepository, sessionRepository, faceService, eventRepository, biometricGovernanceService)
    }

    @Test
    fun `ikkala yuz mos va server so'ragan harakat yetarli bo'lsa challenge tasdiqlanadi`() {
        val fixture = fixture(ProctoringChallengeDirection.RIGHT)
        every { sessionRepository.findByIdAndDeletedFalse(11) } returns fixture
        every { sessionRepository.save(any()) } answers { firstArg() }
        every { faceService.analyzeFrame(any()) } returnsMany listOf(
            FaceFrameAnalysis("center-template", 0.50),
            FaceFrameAnalysis("moved-template", 0.62),
        )
        every { faceService.templateSimilarity("registered-template", any()) } returns 0.91

        val result = service.verify(7, 11, 99, NONCE, centerFrame(), movementFrame())

        assertTrue(result.verified)
        assertEquals(ProctoringSessionStatus.VERIFIED, fixture.status)
        assertEquals(0.12, fixture.movementDelta!!, 0.0001)
        assertEquals(0.91, fixture.identitySimilarity!!, 0.0001)
        verify(exactly = 2) { faceService.analyzeFrame(any()) }
        verify(exactly = 1) { biometricGovernanceService.requireActiveConsent(99) }
    }

    @Test
    fun `noto'g'ri yo'nalish bir martalik challenge ni muvaffaqiyatsiz qiladi`() {
        val fixture = fixture(ProctoringChallengeDirection.LEFT)
        every { sessionRepository.findByIdAndDeletedFalse(11) } returns fixture
        every { sessionRepository.save(any()) } answers { firstArg() }
        every { faceService.analyzeFrame(any()) } returnsMany listOf(
            FaceFrameAnalysis("center-template", 0.50),
            FaceFrameAnalysis("moved-template", 0.62),
        )
        every { faceService.templateSimilarity("registered-template", any()) } returns 0.93

        assertThrows(IllegalArgumentException::class.java) {
            service.verify(7, 11, 99, NONCE, centerFrame(), movementFrame())
        }

        assertEquals(ProctoringSessionStatus.FAILED, fixture.status)
        assertTrue(fixture.failureReason!!.contains("yo'nalish"))
    }

    private fun fixture(direction: ProctoringChallengeDirection): ProctoringSession {
        val quiz = mockk<CourseQuiz>()
        every { quiz.id } returns 7
        val user = mockk<User>()
        every { user.id } returns 99
        every { user.faceDescriptor } returns "registered-template"
        val student = mockk<StudentProfile>()
        every { student.user } returns user
        val enrollment = mockk<CourseEnrollment>()
        every { enrollment.student } returns student
        return ProctoringSession(
            quiz = quiz,
            enrollment = enrollment,
            challengeDirection = direction,
            nonceHash = sha256(NONCE.toByteArray()),
            expiresAt = Instant.now().plusSeconds(60),
        ).also { it.id = 11 }
    }

    private fun centerFrame() = ByteArray(2_048) { 1 }
    private fun movementFrame() = ByteArray(2_048) { 2 }
    private fun sha256(bytes: ByteArray): String = MessageDigest.getInstance("SHA-256")
        .digest(bytes).joinToString("") { "%02x".format(it) }

    companion object {
        private const val NONCE = "server-issued-one-time-nonce"
    }
}
