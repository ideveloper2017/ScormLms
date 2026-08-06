package uz.scorm.lms.app.v1.quiz.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.face.service.FaceService
import uz.scorm.lms.app.v1.quiz.dto.ProctoringChallengeDto
import uz.scorm.lms.app.v1.quiz.dto.ProctoringVerificationDto
import uz.scorm.lms.app.v1.quiz.model.CourseQuiz
import uz.scorm.lms.app.v1.quiz.model.ProctoringChallengeDirection
import uz.scorm.lms.app.v1.quiz.model.ProctoringEvent
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventSeverity
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventSource
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventType
import uz.scorm.lms.app.v1.quiz.model.ProctoringSession
import uz.scorm.lms.app.v1.quiz.model.ProctoringSessionStatus
import uz.scorm.lms.app.v1.quiz.model.QuizAttempt
import uz.scorm.lms.app.v1.quiz.model.QuizStatus
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizRepository
import uz.scorm.lms.app.v1.quiz.repository.ProctoringEventRepository
import uz.scorm.lms.app.v1.quiz.repository.ProctoringSessionRepository
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Duration
import java.time.Instant
import java.util.Base64

@Service
class ProctoringService(
    private val quizRepository: CourseQuizRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val sessionRepository: ProctoringSessionRepository,
    private val faceService: FaceService,
    private val eventRepository: ProctoringEventRepository,
) {
    private val secureRandom = SecureRandom()

    @Transactional
    fun issueChallenge(quizId: Long, userId: Long): ProctoringChallengeDto {
        val quiz = quizRepository.findByIdAndDeletedFalse(quizId)
            ?: throw NoSuchElementException("Test topilmadi: $quizId")
        val now = Instant.now()
        require(quiz.proctoring) { "Bu test uchun proktoring talab qilinmaydi" }
        require(quiz.status == QuizStatus.PUBLISHED) { "Test boshlash uchun ochiq emas" }
        require(!now.isBefore(quiz.opensAt) && now.isBefore(quiz.closesAt)) { "Testning vaqt oynasi yopiq" }
        val enrollment = lockedEnrollment(quiz, userId)
        require(!enrollment.student.user.faceDescriptor.isNullOrBlank()) {
            "Testdan oldin serverda yuz shablonini ro'yxatdan o'tkazing"
        }

        sessionRepository.findAllByQuizIdAndEnrollmentIdAndStatusAndDeletedFalse(
            quizId,
            requireNotNull(enrollment.id),
            ProctoringSessionStatus.CHALLENGE_ISSUED,
        ).forEach {
            it.status = ProctoringSessionStatus.EXPIRED
            it.failureReason = "Yangi challenge berildi"
            sessionRepository.save(it)
        }

        val nonceBytes = ByteArray(32).also(secureRandom::nextBytes)
        val nonce = Base64.getUrlEncoder().withoutPadding().encodeToString(nonceBytes)
        val direction = if (secureRandom.nextBoolean()) {
            ProctoringChallengeDirection.LEFT
        } else {
            ProctoringChallengeDirection.RIGHT
        }
        val session = sessionRepository.save(
            ProctoringSession(
                quiz = quiz,
                enrollment = enrollment,
                challengeDirection = direction,
                nonceHash = sha256(nonce.toByteArray(Charsets.UTF_8)),
                expiresAt = now.plus(CHALLENGE_TTL),
            )
        )
        return ProctoringChallengeDto(
            sessionId = requireNotNull(session.id).toString(),
            nonce = nonce,
            direction = direction.name.lowercase(),
            expiresAt = session.expiresAt,
        )
    }

    @Transactional(noRollbackFor = [IllegalArgumentException::class])
    fun verify(
        quizId: Long,
        sessionId: Long,
        userId: Long,
        nonce: String,
        centerFrame: ByteArray,
        challengeFrame: ByteArray,
    ): ProctoringVerificationDto {
        val session = sessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw NoSuchElementException("Proktoring sessiyasi topilmadi")
        require(session.quiz.id == quizId && session.enrollment.student.user.id == userId) {
            "Proktoring sessiyasi ushbu foydalanuvchi yoki testga tegishli emas"
        }
        require(session.status == ProctoringSessionStatus.CHALLENGE_ISSUED) { "Challenge faol emas" }
        if (!Instant.now().isBefore(session.expiresAt)) fail(session, "Challenge muddati tugagan", expired = true)
        if (!MessageDigest.isEqual(
                session.nonceHash.toByteArray(Charsets.US_ASCII),
                sha256(nonce.toByteArray(Charsets.UTF_8)).toByteArray(Charsets.US_ASCII),
            )) {
            fail(session, "Challenge nonce yaroqsiz")
        }
        validateFrame(centerFrame)
        validateFrame(challengeFrame)
        val centerHash = sha256(centerFrame)
        val challengeHash = sha256(challengeFrame)
        if (centerHash == challengeHash) fail(session, "Ikki xil jonli kadr talab qilinadi")

        val center = try {
            faceService.analyzeFrame(centerFrame)
        } catch (error: RuntimeException) {
            fail(session, error.message ?: "Markaziy kadr tahlil qilinmadi")
        }
        val moved = try {
            faceService.analyzeFrame(challengeFrame)
        } catch (error: RuntimeException) {
            fail(session, error.message ?: "Harakat kadri tahlil qilinmadi")
        }
        if (center.centerX !in CENTER_MIN..CENTER_MAX) fail(session, "Birinchi kadrda yuzni markazga joylashtiring")

        val storedTemplate = session.enrollment.student.user.faceDescriptor.orEmpty()
        val centerSimilarity = faceService.templateSimilarity(storedTemplate, center.template)
        val movedSimilarity = faceService.templateSimilarity(storedTemplate, moved.template)
        val identitySimilarity = minOf(centerSimilarity, movedSimilarity)
        if (identitySimilarity < IDENTITY_THRESHOLD) fail(session, "Yuz ro'yxatdan o'tgan foydalanuvchiga mos kelmadi")

        val delta = moved.centerX - center.centerX
        val movementAccepted = when (session.challengeDirection) {
            ProctoringChallengeDirection.LEFT -> delta <= -MOVEMENT_THRESHOLD
            ProctoringChallengeDirection.RIGHT -> delta >= MOVEMENT_THRESHOLD
        }
        if (!movementAccepted) fail(session, "So'ralgan yo'nalishdagi harakat tasdiqlanmadi")

        val verifiedAt = Instant.now()
        session.status = ProctoringSessionStatus.VERIFIED
        session.verifiedAt = verifiedAt
        session.centerFrameHash = centerHash
        session.challengeFrameHash = challengeHash
        session.identitySimilarity = identitySimilarity
        session.movementDelta = delta
        session.failureReason = null
        sessionRepository.save(session)
        return ProctoringVerificationDto(requireNotNull(session.id).toString(), true, verifiedAt)
    }

    /** Called inside QuizService.start's transaction. A verified challenge is single-use. */
    @Transactional
    fun consumeRequiredSession(quiz: CourseQuiz, enrollment: CourseEnrollment, attempt: QuizAttempt) {
        if (!quiz.proctoring) return
        val session = sessionRepository
            .findFirstByQuizIdAndEnrollmentIdAndStatusAndDeletedFalseOrderByVerifiedAtDesc(
                requireNotNull(quiz.id),
                requireNotNull(enrollment.id),
                ProctoringSessionStatus.VERIFIED,
            ) ?: throw IllegalArgumentException("Testni boshlashdan oldin proktoring tekshiruvidan o'ting")
        if (!Instant.now().isBefore(session.expiresAt)) {
            session.status = ProctoringSessionStatus.EXPIRED
            session.failureReason = "Tasdiqlangan challenge muddati tugagan"
            sessionRepository.save(session)
            throw IllegalArgumentException("Proktoring tasdig'i muddati tugagan")
        }
        val consumedAt = Instant.now()
        session.status = ProctoringSessionStatus.CONSUMED
        session.attempt = attempt
        session.consumedAt = consumedAt
        sessionRepository.save(session)
        eventRepository.save(
            ProctoringEvent(
                session = session,
                attempt = attempt,
                type = ProctoringEventType.SESSION_STARTED,
                severity = ProctoringEventSeverity.INFO,
                source = ProctoringEventSource.SERVER,
                eventKey = "server:start:${attempt.id}",
                occurredAt = consumedAt,
            )
        )
    }

    @Transactional
    fun completeAttempt(attempt: QuizAttempt) {
        if (!attempt.quiz.proctoring) return
        val attemptId = requireNotNull(attempt.id)
        val session = sessionRepository.findFirstByAttemptIdAndDeletedFalse(attemptId) ?: return
        if (!eventRepository.existsByAttemptIdAndTypeAndDeletedFalse(attemptId, ProctoringEventType.SESSION_ENDED)) {
            eventRepository.save(
                ProctoringEvent(
                    session = session,
                    attempt = attempt,
                    type = ProctoringEventType.SESSION_ENDED,
                    severity = ProctoringEventSeverity.INFO,
                    source = ProctoringEventSource.SERVER,
                    eventKey = "server:end:$attemptId",
                    occurredAt = attempt.submittedAt ?: Instant.now(),
                )
            )
        }
        session.status = ProctoringSessionStatus.COMPLETED
        sessionRepository.save(session)
    }

    private fun lockedEnrollment(quiz: CourseQuiz, userId: Long): CourseEnrollment =
        enrollmentRepository.findFirstByCourseIdAndStudentUserIdAndStatusInAndDeletedFalse(
            requireNotNull(quiz.course.id),
            userId,
            setOf(CourseEnrollmentStatus.ACTIVE),
        ) ?: throw IllegalArgumentException("Test kursiga faol biriktirish talab qilinadi")

    private fun validateFrame(frame: ByteArray) {
        require(frame.size in MIN_FRAME_BYTES..MAX_FRAME_BYTES) {
            "Kadr hajmi ${MIN_FRAME_BYTES / 1024} KB va ${MAX_FRAME_BYTES / 1024 / 1024} MB oralig'ida bo'lishi kerak"
        }
    }

    private fun fail(session: ProctoringSession, reason: String, expired: Boolean = false): Nothing {
        session.status = if (expired) ProctoringSessionStatus.EXPIRED else ProctoringSessionStatus.FAILED
        session.failureReason = reason.take(500)
        sessionRepository.save(session)
        throw IllegalArgumentException(reason)
    }

    private fun sha256(bytes: ByteArray): String = MessageDigest.getInstance("SHA-256")
        .digest(bytes)
        .joinToString("") { "%02x".format(it) }

    companion object {
        private val CHALLENGE_TTL: Duration = Duration.ofMinutes(2)
        private const val MIN_FRAME_BYTES = 1_024
        private const val MAX_FRAME_BYTES = 5 * 1024 * 1024
        private const val CENTER_MIN = 0.30
        private const val CENTER_MAX = 0.70
        private const val MOVEMENT_THRESHOLD = 0.08
        private const val IDENTITY_THRESHOLD = 0.85
    }
}
