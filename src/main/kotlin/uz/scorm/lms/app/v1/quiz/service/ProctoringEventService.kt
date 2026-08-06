package uz.scorm.lms.app.v1.quiz.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.quiz.dto.ProctoringEventBatchRequest
import uz.scorm.lms.app.v1.quiz.dto.ProctoringEventBatchResponse
import uz.scorm.lms.app.v1.quiz.model.ProctoringEvent
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventSeverity
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventSource
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventType
import uz.scorm.lms.app.v1.quiz.model.ProctoringSessionStatus
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
import uz.scorm.lms.app.v1.quiz.repository.ProctoringEventRepository
import uz.scorm.lms.app.v1.quiz.repository.ProctoringSessionRepository
import java.time.Instant
import java.util.UUID

@Service
class ProctoringEventService(
    private val sessionRepository: ProctoringSessionRepository,
    private val eventRepository: ProctoringEventRepository,
) {
    @Transactional
    fun recordClientEvents(
        quizId: Long,
        attemptId: Long,
        userId: Long,
        request: ProctoringEventBatchRequest,
    ): ProctoringEventBatchResponse {
        require(request.events.isNotEmpty()) { "Kamida bitta proktoring hodisasi talab qilinadi" }
        require(request.events.size <= MAX_BATCH_SIZE) { "Bir so'rovda ko'pi bilan $MAX_BATCH_SIZE hodisa yuboriladi" }
        val session = sessionRepository.findFirstByAttemptIdAndDeletedFalse(attemptId)
            ?: throw IllegalArgumentException("Urinishga bog'langan proktoring sessiyasi topilmadi")
        val attempt = requireNotNull(session.attempt) { "Proktoring sessiyasi urinishga bog'lanmagan" }
        require(attempt.id == attemptId && session.quiz.id == quizId && attempt.quiz.id == quizId) {
            "Proktoring hodisasi boshqa test yoki urinishga tegishli"
        }
        require(session.enrollment.student.user.id == userId && attempt.enrollment.student.user.id == userId) {
            "Boshqa foydalanuvchining proktoring urinishiga yozish taqiqlangan"
        }
        require(session.status == ProctoringSessionStatus.CONSUMED && attempt.status == QuizAttemptStatus.IN_PROGRESS) {
            "Faqat faol proktorli urinish hodisa qabul qiladi"
        }

        val now = Instant.now()
        val existingCount = eventRepository.countByAttemptIdAndDeletedFalse(attemptId)
        require(existingCount < MAX_EVENTS_PER_ATTEMPT) { "Proktoring hodisalari limiti tugagan" }
        var accepted = 0
        var duplicates = 0
        val seenInBatch = mutableSetOf<String>()
        request.events.sortedBy { it.occurredAt }.forEach { item ->
            require(item.type in CLIENT_EVENT_TYPES) { "${item.type} hodisasini faqat server yaratishi mumkin" }
            val eventKey = try {
                UUID.fromString(item.clientEventId).toString()
            } catch (_: IllegalArgumentException) {
                throw IllegalArgumentException("clientEventId UUID formatida bo'lishi kerak")
            }
            require(!item.occurredAt.isBefore(attempt.startedAt.minusSeconds(CLOCK_SKEW_SECONDS))) {
                "Hodisa urinish boshlanishidan oldin sodir bo'lmagan bo'lishi kerak"
            }
            require(!item.occurredAt.isAfter(now.plusSeconds(CLOCK_SKEW_SECONDS))) { "Hodisa vaqti kelajakda" }
            require(!item.occurredAt.isAfter(attempt.expiresAt.plusSeconds(CLOCK_SKEW_SECONDS))) {
                "Hodisa test muddati tashqarisida"
            }
            if (!seenInBatch.add(eventKey) || eventRepository.existsBySessionIdAndEventKeyAndDeletedFalse(
                    requireNotNull(session.id),
                    eventKey,
                )) {
                duplicates++
                return@forEach
            }
            require(existingCount + accepted < MAX_EVENTS_PER_ATTEMPT) { "Proktoring hodisalari limiti tugagan" }
            eventRepository.save(
                ProctoringEvent(
                    session = session,
                    attempt = attempt,
                    type = item.type,
                    severity = severity(item.type),
                    source = ProctoringEventSource.CLIENT,
                    eventKey = eventKey,
                    occurredAt = item.occurredAt,
                )
            )
            accepted++
        }
        return ProctoringEventBatchResponse(accepted, duplicates, now)
    }

    companion object {
        private const val MAX_BATCH_SIZE = 50
        private const val MAX_EVENTS_PER_ATTEMPT = 5_000
        private const val CLOCK_SKEW_SECONDS = 30L
        private val CLIENT_EVENT_TYPES = setOf(
            ProctoringEventType.CAMERA_STARTED,
            ProctoringEventType.CAMERA_STOPPED,
            ProctoringEventType.CAMERA_PERMISSION_DENIED,
            ProctoringEventType.TAB_HIDDEN,
            ProctoringEventType.TAB_VISIBLE,
            ProctoringEventType.WINDOW_BLURRED,
            ProctoringEventType.WINDOW_FOCUSED,
            ProctoringEventType.NETWORK_OFFLINE,
            ProctoringEventType.NETWORK_ONLINE,
            ProctoringEventType.HEARTBEAT,
            ProctoringEventType.PAGE_EXIT,
        )

        fun severity(type: ProctoringEventType): ProctoringEventSeverity = when (type) {
            ProctoringEventType.CAMERA_PERMISSION_DENIED -> ProctoringEventSeverity.CRITICAL
            ProctoringEventType.CAMERA_STOPPED,
            ProctoringEventType.TAB_HIDDEN,
            ProctoringEventType.PAGE_EXIT -> ProctoringEventSeverity.HIGH
            ProctoringEventType.WINDOW_BLURRED,
            ProctoringEventType.NETWORK_OFFLINE -> ProctoringEventSeverity.MEDIUM
            else -> ProctoringEventSeverity.INFO
        }
    }
}
