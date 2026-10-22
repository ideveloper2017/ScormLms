package uz.scorm.lms.app.v1.quiz.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.face.service.FaceDetectionException
import uz.scorm.lms.app.v1.face.service.FaceService
import uz.scorm.lms.app.v1.face.service.FaceTemplate
import uz.scorm.lms.app.v1.quiz.model.ProctoringEvent
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventSource
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventType
import uz.scorm.lms.app.v1.quiz.model.QuizAttempt
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
import uz.scorm.lms.app.v1.quiz.repository.ProctoringEventRepository
import uz.scorm.lms.app.v1.quiz.repository.ProctoringSessionRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizAttemptRepository
import java.time.Duration
import java.time.Instant
import kotlin.random.Random

/** Davriy tekshiruv javobi: talabaga faqat yordamchi maslahat (yuz ko'rinmadi) va keyingi tekshiruv vaqti. */
data class IdentityCheckResultDto(
    val recorded: Boolean,
    /** Yuz topilmagan yoki bir nechta yuz — talaba tuzatishi uchun. Mos kelmaslik oshkor qilinmaydi. */
    val hint: String?,
    val nextCheckInSeconds: Int,
)

/**
 * Imtihon DAVOMIDA shaxsni davriy tekshirish. Avval shaxs faqat test boshida (harakat challenge bilan)
 * tekshirilardi — tasdiqdan keyin o'rniga boshqa odam o'tirib olishi mumkin edi.
 *
 * Brauzer bir necha daqiqada bir kadr yuboradi; server uni SFace bilan ro'yxatdagi shablonga solishtiradi
 * va natijani proktoring jurnaliga SERVER manbali hodisa sifatida yozadi. Kadr saqlanmaydi. Hodisalar
 * proktor uchun signal — bahoga avtomatik ta'sir qilmaydi (mavjud siyosat). Tekshiruvlar umuman kelmasa
 * (kamera bloklangan) urinish yakunida alohida signal yoziladi ([ProctoringService.completeAttempt]).
 */
@Service
class ProctoringIdentityCheckService(
    private val attemptRepository: QuizAttemptRepository,
    private val sessionRepository: ProctoringSessionRepository,
    private val eventRepository: ProctoringEventRepository,
    private val faceService: FaceService,
) {
    companion object {
        val IDENTITY_EVENT_TYPES = setOf(
            ProctoringEventType.IDENTITY_VERIFIED,
            ProctoringEventType.IDENTITY_MISMATCH,
            ProctoringEventType.IDENTITY_FACE_NOT_FOUND,
            ProctoringEventType.IDENTITY_MULTIPLE_FACES,
        )
        /** Bitta urinish uchun ikki tekshiruv orasidagi eng kichik oraliq (SFace og'ir — suiiste'mol qilinmasin). */
        val MIN_INTERVAL: Duration = Duration.ofSeconds(60)
        /** Keyingi tekshiruv tasodifiy vaqtda — talaba qachon tekshirilishini oldindan bilmasin. */
        const val NEXT_CHECK_MIN_SECONDS = 120
        const val NEXT_CHECK_MAX_SECONDS = 240
        private const val MIN_FRAME_BYTES = 1_024
        private const val MAX_FRAME_BYTES = 5 * 1024 * 1024
    }

    @Transactional
    fun check(quizId: Long, attemptId: Long, userId: Long, frame: ByteArray, now: Instant = Instant.now()): IdentityCheckResultDto {
        val attempt = attemptRepository.findByIdAndDeletedFalse(attemptId)
            ?: throw NoSuchElementException("Test urinishi topilmadi")
        require(attempt.quiz.id == quizId && attempt.enrollment.student.user.id == userId) {
            "Test urinishi ushbu foydalanuvchi yoki testga tegishli emas"
        }
        require(attempt.quiz.proctoring) { "Bu test proktoringsiz" }
        require(attempt.status == QuizAttemptStatus.IN_PROGRESS && now.isBefore(attempt.expiresAt.plusSeconds(30))) {
            "Test urinishi yakunlangan"
        }
        require(frame.size in MIN_FRAME_BYTES..MAX_FRAME_BYTES) { "Kadr hajmi yaroqsiz" }
        val session = sessionRepository.findFirstByAttemptIdAndDeletedFalse(attemptId)
            ?: throw IllegalArgumentException("Proktoring sessiyasi topilmadi")

        val last = eventRepository.findFirstByAttemptIdAndTypeInAndDeletedFalseOrderByOccurredAtDesc(attemptId, IDENTITY_EVENT_TYPES)
        if (last != null && Duration.between(last.occurredAt, now) < MIN_INTERVAL) {
            return IdentityCheckResultDto(recorded = false, hint = null, nextCheckInSeconds = nextCheck())
        }

        val stored = attempt.enrollment.student.user.faceDescriptor
        val (type, hint) = try {
            val similarity = if (FaceTemplate.isCurrent(stored)) {
                faceService.templateSimilarity(stored!!, faceService.analyzeFrame(frame).template)
            } else 0.0
            if (similarity >= faceService.matchThreshold) ProctoringEventType.IDENTITY_VERIFIED to null
            else ProctoringEventType.IDENTITY_MISMATCH to null
        } catch (error: FaceDetectionException) {
            when (error.reason) {
                FaceDetectionException.Reason.NO_FACE ->
                    ProctoringEventType.IDENTITY_FACE_NOT_FOUND to "Yuzingiz kamerada to'liq va yorug' ko'rinsin"
                FaceDetectionException.Reason.MULTIPLE_FACES ->
                    ProctoringEventType.IDENTITY_MULTIPLE_FACES to "Kamerada faqat sizning yuzingiz ko'rinishi kerak"
            }
        }
        eventRepository.save(event(session, attempt, type, now))
        return IdentityCheckResultDto(recorded = true, hint = hint, nextCheckInSeconds = nextCheck())
    }

    private fun event(session: uz.scorm.lms.app.v1.quiz.model.ProctoringSession, attempt: QuizAttempt, type: ProctoringEventType, at: Instant) =
        ProctoringEvent(
            session = session,
            attempt = attempt,
            type = type,
            severity = ProctoringEventService.severity(type),
            source = ProctoringEventSource.SERVER,
            eventKey = "server:identity:${attempt.id}:${at.toEpochMilli()}",
            occurredAt = at,
        )

    private fun nextCheck() = Random.nextInt(NEXT_CHECK_MIN_SECONDS, NEXT_CHECK_MAX_SECONDS + 1)
}
