package uz.scorm.lms.app.v1.notification.model

import jakarta.persistence.*
import uz.scorm.lms.app.common.DateAudit
import uz.scorm.lms.app.v1.user.model.User
import java.util.UUID

enum class NotificationType {
    COURSE, ASSIGNMENT, TEST, GRADE, ATTENDANCE, SYSTEM
}

enum class NotificationPriority {
    LOW, NORMAL, HIGH, URGENT
}

@Entity
@Table(name = "notifications", indexes = [
    Index(name = "idx_notif_user_id", columnList = "user_id"),
    Index(name = "idx_notif_is_read", columnList = "user_id, is_read"),
])
class Notification(

    @Id
    val id: String = UUID.randomUUID().toString(),

    @Column(nullable = false)
    val title: String = "",

    @Column(nullable = false, columnDefinition = "TEXT")
    val message: String = "",

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    val type: NotificationType = NotificationType.SYSTEM,

    @Column(name = "is_read", nullable = false)
    var isRead: Boolean = false,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    val priority: NotificationPriority = NotificationPriority.NORMAL,

    @Column(name = "related_id")
    val relatedId: String? = null,

    @Column(name = "action_url", length = 500)
    val actionUrl: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User? = null,

) : DateAudit()
