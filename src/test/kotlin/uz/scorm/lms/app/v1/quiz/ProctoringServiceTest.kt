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
import uz.scorm.lms.app.v1.face.service.FaceTemplate
import uz.scorm.lms.app.v1.quiz.model.CourseQuiz
import uz.scorm.lms.app.v1.quiz.model.ProctoringChallengeDirection
import uz.scorm.lms.app.v1.quiz.model.ProctoringEvent
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventSeverity
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventSource
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventType
import uz.scorm.lms.app.v1.quiz.model.ProctoringSession
import uz.scorm.lms.app.v1.quiz.model.ProctoringSessionStatus
import uz.scorm.lms.app.v1.quiz.model.QuizAttempt
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
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
        every { faceService.matchThreshold } returns 0.363
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
        every { faceService.templateSimilarity(REGISTERED, any()) } returns 0.91

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
        every { faceService.templateSimilarity(REGISTERED, any()) } returns 0.93

        assertThrows(IllegalArgumentException::class.java) {
            service.verify(7, 11, 99, NONCE, centerFrame(), movementFrame())
        }

        assertEquals(ProctoringSessionStatus.FAILED, fixture.status)
        assertTrue(fixture.failureReason!!.contains("yo'nalish"))
    }

    @Test
    fun `boshqa odamning yuzi SFace chegarasidan past bo'lsa challenge muvaffaqiyatsiz`() {
        val fixture = fixture(ProctoringChallengeDirection.RIGHT)
        every { sessionRepository.findByIdAndDeletedFalse(11) } returns fixture
        every { sessionRepository.save(any()) } answers { firstArg() }
        every { faceService.analyzeFrame(any()) } returnsMany listOf(
            FaceFrameAnalysis("center-template", 0.50),
            FaceFrameAnalysis("moved-template", 0.62),
        )
        every { faceService.templateSimilarity(REGISTERED, any()) } returns 0.21

        assertThrows(IllegalArgumentException::class.java) {
            service.verify(7, 11, 99, NONCE, centerFrame(), movementFrame())
        }

        assertEquals(ProctoringSessionStatus.FAILED, fixture.status)
        assertTrue(fixture.failureReason!!.contains("mos kelmadi"))
    }

    @Test
    fun `eski piksel shablonli talaba solishtirilmaydi - qayta ro'yxatdan o'tish so'raladi`() {
        val fixture = fixture(ProctoringChallengeDirection.RIGHT, descriptor = "bGVnYWN5LXBpeGVsLXRlbXBsYXRl")
        every { sessionRepository.findByIdAndDeletedFalse(11) } returns fixture
        every { sessionRepository.save(any()) } answers { firstArg() }
        every { faceService.analyzeFrame(any()) } returnsMany listOf(
            FaceFrameAnalysis("center-template", 0.50),
            FaceFrameAnalysis("moved-template", 0.62),
        )

        assertThrows(IllegalArgumentException::class.java) {
            service.verify(7, 11, 99, NONCE, centerFrame(), movementFrame())
        }

        assertEquals(ProctoringSessionStatus.FAILED, fixture.status)
        assertEquals(FaceTemplate.RE_ENROLL_MESSAGE, fixture.failureReason)
        verify(exactly = 0) { faceService.templateSimilarity(any(), any()) }
    }

    // ── Kuzatuv signali uzilishi (MONITORING_GAP) ─────────────────────────────────────────

    private val attemptStart: Instant = Instant.parse("2026-11-09T09:00:00Z")

    /** 30 daqiqalik urinishni yakunlaydi va server yozgan hodisalarni qaytaradi. */
    private fun completeAttempt(
        clientSignals: List<Instant>,
        submittedAfterSeconds: Long = 1_800,
        status: QuizAttemptStatus = QuizAttemptStatus.SUBMITTED,
        gapAlreadyFlagged: Boolean = false,
        proctored: Boolean = true,
    ): List<ProctoringEvent> {
        val session = fixture(ProctoringChallengeDirection.RIGHT)
        val quiz = mockk<CourseQuiz>()
        every { quiz.proctoring } returns proctored
        val attempt = mockk<QuizAttempt>()
        every { attempt.id } returns 42
        every { attempt.quiz } returns quiz
        every { attempt.startedAt } returns attemptStart
        every { attempt.expiresAt } returns attemptStart.plusSeconds(1_800)
        every { attempt.submittedAt } returns attemptStart.plusSeconds(submittedAfterSeconds)
        every { attempt.status } returns status
        every { sessionRepository.findFirstByAttemptIdAndDeletedFalse(42) } returns session
        every { sessionRepository.save(any()) } answers { firstArg() }
        every { eventRepository.existsByAttemptIdAndTypeAndDeletedFalse(42, ProctoringEventType.SESSION_ENDED) } returns false
        every { eventRepository.existsByAttemptIdAndTypeAndDeletedFalse(42, ProctoringEventType.MONITORING_GAP) } returns gapAlreadyFlagged
        every { eventRepository.findEventTimes(42, ProctoringEventSource.CLIENT) } returns clientSignals
        val saved = mutableListOf<ProctoringEvent>()
        every { eventRepository.save(capture(saved)) } answers { firstArg() }

        service.completeAttempt(attempt)

        if (proctored) assertEquals(ProctoringSessionStatus.COMPLETED, session.status)
        return saved
    }

    private fun every30Seconds(fromSecond: Long, toSecond: Long): List<Instant> =
        (fromSecond..toSecond step 30).map { attemptStart.plusSeconds(it) }

    private fun List<ProctoringEvent>.gap(): ProctoringEvent? = firstOrNull { it.type == ProctoringEventType.MONITORING_GAP }

    @Test
    fun `signallar muntazam kelgan urinishda uzilish belgilanmaydi`() {
        val saved = completeAttempt(clientSignals = every30Seconds(30, 1_770))

        assertEquals(listOf(ProctoringEventType.SESSION_ENDED), saved.map { it.type })
    }

    @Test
    fun `brauzer hech qanday signal yubormagan urinish toza ko'rinmaydi`() {
        val gap = completeAttempt(clientSignals = emptyList()).gap()!!

        assertEquals(ProctoringEventSeverity.HIGH, gap.severity)
        assertEquals(ProctoringEventSource.SERVER, gap.source)
        assertEquals(attemptStart, gap.occurredAt)
        assertEquals("server:gap:42", gap.eventKey)
    }

    @Test
    fun `urinish o'rtasida signal yo'qolsa uzilish boshlangan vaqt bilan belgilanadi`() {
        // 10-daqiqadan 20-daqiqagacha signal yo'q
        val gap = completeAttempt(clientSignals = every30Seconds(30, 600) + every30Seconds(1_200, 1_770)).gap()!!

        assertEquals(ProctoringEventSeverity.HIGH, gap.severity)
        assertEquals(attemptStart.plusSeconds(600), gap.occurredAt)
    }

    @Test
    fun `ikki daqiqagacha bo'lgan uzilish (tarmoq sekinligi) belgilanmaydi`() {
        // 90 soniyalik tanaffus: chegaradan (120 s) kichik
        val saved = completeAttempt(clientSignals = every30Seconds(30, 600) + every30Seconds(690, 1_770))

        assertEquals(null, saved.gap())
    }

    @Test
    fun `vaqt tugashi bilan yopilgan tashlab ketilgan urinish o'rtacha darajada belgilanadi`() {
        // Talaba 5-daqiqada sahifani yopgan; urinishni muddat tugagach server yopgan
        val gap = completeAttempt(
            clientSignals = every30Seconds(30, 300),
            submittedAfterSeconds = 1_920,
            status = QuizAttemptStatus.TIMED_OUT,
        ).gap()!!

        assertEquals(ProctoringEventSeverity.MEDIUM, gap.severity)
        assertEquals(attemptStart.plusSeconds(300), gap.occurredAt)
    }

    @Test
    fun `ikki daqiqadan qisqa urinishda uzilish tekshirilmaydi`() {
        val saved = completeAttempt(clientSignals = emptyList(), submittedAfterSeconds = 90)

        assertEquals(null, saved.gap())
    }

    @Test
    fun `uzilish bir urinish uchun faqat bir marta yoziladi`() {
        val saved = completeAttempt(clientSignals = emptyList(), gapAlreadyFlagged = true)

        assertEquals(null, saved.gap())
    }

    @Test
    fun `proktoringsiz testda hech narsa yozilmaydi`() {
        val saved = completeAttempt(clientSignals = emptyList(), proctored = false)

        assertTrue(saved.isEmpty())
    }

    private fun fixture(direction: ProctoringChallengeDirection, descriptor: String = REGISTERED): ProctoringSession {
        val quiz = mockk<CourseQuiz>()
        every { quiz.id } returns 7
        val user = mockk<User>()
        every { user.id } returns 99
        every { user.faceDescriptor } returns descriptor
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
        private val REGISTERED = FaceTemplate.encode(FloatArray(FaceTemplate.DIMENSIONS) { (it % 7 - 3).toFloat() })
    }
}
