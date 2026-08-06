package uz.scorm.lms.app.v1.quiz.dto

import uz.scorm.lms.app.v1.quiz.model.ProctoringEventType
import java.time.Instant

data class ProctoringEventBatchRequest(
    val events: List<ProctoringClientEventRequest>,
)

data class ProctoringClientEventRequest(
    val clientEventId: String,
    val type: ProctoringEventType,
    val occurredAt: Instant,
)

data class ProctoringEventBatchResponse(
    val accepted: Int,
    val duplicates: Int,
    val serverTime: Instant,
)
