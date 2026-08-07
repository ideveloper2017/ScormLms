package uz.scorm.lms.app.v1.support.dto

import java.time.Instant

data class CreateSupportTicketRequest(
    val subject: String,
    val description: String,
    val category: String,
    val impact: String,
    val courseId: Long? = null,
)

data class SupportCommentRequest(
    val body: String,
    val internal: Boolean = false,
)

data class SupportAssignRequest(val assigneeId: Long)

data class SupportStatusRequest(
    val status: String,
    val resolutionSummary: String? = null,
)

data class SupportAssigneeDto(val id: Long, val fullName: String, val username: String, val roleName: String?)

data class SupportSlaDto(
    val policyVersion: String,
    val responseDueAt: Instant,
    val resolutionDueAt: Instant,
    val firstRespondedAt: Instant?,
    val resolvedAt: Instant?,
    val paused: Boolean,
    val pausedSeconds: Long,
    val responseBreached: Boolean,
    val resolutionBreached: Boolean,
    val responseRemainingSeconds: Long?,
    val resolutionRemainingSeconds: Long?,
)

data class SupportTicketSummaryDto(
    val id: Long,
    val ticketCode: String,
    val subject: String,
    val category: String,
    val impact: String,
    val priority: String,
    val status: String,
    val requesterId: Long,
    val requesterName: String,
    val assigneeId: Long?,
    val assigneeName: String?,
    val courseId: Long?,
    val courseTitle: String?,
    val sla: SupportSlaDto,
    val lastActivityAt: Instant,
    val createdAt: Instant?,
)

data class SupportTicketEventDto(
    val id: Long,
    val sequenceNo: Int,
    val actorId: Long,
    val actorName: String,
    val eventType: String,
    val visibility: String,
    val body: String?,
    val fromStatus: String?,
    val toStatus: String?,
    val occurredAt: Instant,
)

data class SupportTicketDetailDto(
    val ticket: SupportTicketSummaryDto,
    val description: String,
    val resolutionSummary: String?,
    val events: List<SupportTicketEventDto>,
    val canComment: Boolean,
    val canCancel: Boolean,
    val canReopen: Boolean,
    val canManage: Boolean,
    val allowedStatuses: List<String>,
)

data class SupportQueueMetricsDto(
    val totalActive: Long,
    val unassigned: Long,
    val responseBreached: Long,
    val resolutionBreached: Long,
    val dueWithinFourHours: Long,
    val resolved: Long,
    val averageFirstResponseMinutes: Double?,
    val averageResolutionMinutes: Double?,
    val byStatus: Map<String, Long>,
    val measuredAt: Instant,
)
