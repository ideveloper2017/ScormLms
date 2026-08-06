package uz.scorm.lms.app.v1.quiz.dto

import uz.scorm.lms.app.v1.quiz.model.ProctoringAppealStatus
import java.time.Instant

data class ProctoringAppealEventDto(
    val id: String,
    val type: String,
    val severity: String,
    val occurredAt: Instant,
)

data class ProctoringAppealDto(
    val id: String,
    val attemptId: String,
    val quizId: String,
    val examTitle: String,
    val course: String,
    val studentName: String,
    val reason: String,
    val requestedAt: Instant,
    val status: String,
    val disputedEvents: List<ProctoringAppealEventDto>,
    val reviewedAt: Instant?,
    val reviewedBy: String?,
    val decision: String?,
)

data class ProctoringAppealContextDto(
    val attemptId: String,
    val quizId: String,
    val eligible: Boolean,
    val deadline: Instant,
    val riskEvents: List<ProctoringAppealEventDto>,
    val appeal: ProctoringAppealDto?,
)

data class CreateProctoringAppealRequest(
    val reason: String,
    val eventIds: Set<Long>,
)

data class ReviewProctoringAppealRequest(
    val status: ProctoringAppealStatus,
    val decision: String,
)
