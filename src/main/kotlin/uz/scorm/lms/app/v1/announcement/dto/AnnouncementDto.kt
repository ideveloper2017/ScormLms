package uz.scorm.lms.app.v1.announcement.dto

import java.time.Instant

data class AnnouncementUpsertRequest(
    val title: String,
    val body: String,
    val audience: String,
    val courseId: Long? = null,
    val category: String = "INFORMATION",
    val priority: String = "NORMAL",
    val channels: Set<String> = setOf("IN_APP"),
    val actionUrl: String? = null,
)

data class AnnouncementCourseOptionDto(val id: Long, val title: String, val status: String?)

data class AnnouncementManageOptionsDto(
    val canPublishInstitution: Boolean,
    val courses: List<AnnouncementCourseOptionDto>,
    val supportedChannels: List<String> = listOf("IN_APP", "EMAIL", "PUSH"),
)

data class AnnouncementDeliveryStatDto(
    val channel: String,
    val pending: Long,
    val delivered: Long,
    val read: Long,
    val failed: Long,
    val skipped: Long,
)

data class AnnouncementDto(
    val id: Long,
    val title: String,
    val body: String,
    val audience: String,
    val courseId: Long?,
    val courseTitle: String?,
    val category: String,
    val priority: String,
    val status: String,
    val channels: Set<String>,
    val actionUrl: String?,
    val authorId: Long,
    val authorName: String,
    val publishedAt: Instant?,
    val archivedAt: Instant?,
    val createdAt: Instant?,
    val recipientCount: Long,
    val readCount: Long,
    val deliveryStats: List<AnnouncementDeliveryStatDto>,
    val canEdit: Boolean,
    val canPublish: Boolean,
    val canArchive: Boolean,
    val canRetry: Boolean,
)

data class AnnouncementInboxDto(
    val id: Long,
    val deliveryId: Long,
    val title: String,
    val body: String,
    val audience: String,
    val courseId: Long?,
    val courseTitle: String?,
    val category: String,
    val priority: String,
    val actionUrl: String?,
    val authorName: String,
    val publishedAt: Instant,
    val read: Boolean,
    val readAt: Instant?,
)

data class AnnouncementDeliveryDto(
    val id: Long,
    val recipientId: Long,
    val recipientName: String,
    val channel: String,
    val status: String,
    val attemptCount: Int,
    val destinationMasked: String?,
    val providerReference: String?,
    val lastAttemptAt: Instant?,
    val deliveredAt: Instant?,
    val readAt: Instant?,
    val lastError: String?,
)

data class AnnouncementDeliveryReportDto(
    val announcementId: Long,
    val stats: List<AnnouncementDeliveryStatDto>,
    val deliveries: List<AnnouncementDeliveryDto>,
)

data class AnnouncementRetryResultDto(
    val attempted: Int,
    val delivered: Int,
    val failed: Int,
    val skipped: Int,
)
