package uz.scorm.lms.app.v1.notification.dto

import uz.scorm.lms.app.v1.notification.model.Notification
import java.time.Instant

data class NotificationDto(
    val id: String,
    val title: String,
    val message: String,
    val type: String,           // lowercase: "course", "assignment", ...
    val isRead: Boolean,
    val createdAt: String,      // ISO-8601 string — frontend new Date() ga mos
    val relatedId: String?,
    val priority: String,       // lowercase: "low", "normal", "high", "urgent"
    val actionUrl: String?,
)

data class NotificationCountDto(
    val count: Long,
)

data class CreateNotificationRequest(
    val userId: Long,
    val title: String,
    val message: String,
    val type: String = "system",
    val priority: String = "normal",
    val relatedId: String? = null,
    val actionUrl: String? = null,
)

fun Notification.toDto() = NotificationDto(
    id        = id,
    title     = title,
    message   = message,
    type      = type.name.lowercase(),
    isRead    = isRead,
    createdAt = (createdAt ?: Instant.now()).toString(),
    relatedId = relatedId,
    priority  = priority.name.lowercase(),
    actionUrl = actionUrl,
)
