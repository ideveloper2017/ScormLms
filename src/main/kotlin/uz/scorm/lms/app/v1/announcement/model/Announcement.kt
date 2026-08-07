package uz.scorm.lms.app.v1.announcement.model

import jakarta.persistence.*
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant

enum class AnnouncementAudience { COURSE, INSTITUTION }
enum class AnnouncementCategory { INFORMATION, DEADLINE, EVENT, WARNING }
enum class AnnouncementPriority { LOW, NORMAL, HIGH, URGENT }
enum class AnnouncementStatus { DRAFT, PUBLISHED, ARCHIVED }
enum class AnnouncementChannel { IN_APP, EMAIL, PUSH }
enum class AnnouncementDeliveryStatus { PENDING, DELIVERED, READ, FAILED, SKIPPED }

@Entity
@Table(name = "announcements", indexes = [
    Index(name = "idx_announcement_author_status", columnList = "author_user_id,status"),
    Index(name = "idx_announcement_course_status", columnList = "course_id,status"),
])
class Announcement(
    @Column(nullable = false, length = 250)
    var title: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    var body: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "audience_type", nullable = false, length = 20)
    var audience: AnnouncementAudience,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    var course: Course? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var category: AnnouncementCategory = AnnouncementCategory.INFORMATION,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    var priority: AnnouncementPriority = AnnouncementPriority.NORMAL,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: AnnouncementStatus = AnnouncementStatus.DRAFT,

    @Column(nullable = false, length = 100)
    var channels: String = AnnouncementChannel.IN_APP.name,

    @Column(name = "action_url", length = 500)
    var actionUrl: String? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_user_id", nullable = false)
    var author: User,

    @Column(name = "published_at")
    var publishedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "published_by_user_id")
    var publishedBy: User? = null,

    @Column(name = "archived_at")
    var archivedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "archived_by_user_id")
    var archivedBy: User? = null,
) : BaseEntity()

@Entity
@Table(name = "announcement_deliveries", uniqueConstraints = [
    UniqueConstraint(name = "uk_announcement_delivery", columnNames = ["announcement_id", "recipient_user_id", "channel"]),
])
class AnnouncementDelivery(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "announcement_id", nullable = false)
    var announcement: Announcement,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    var recipient: User,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var channel: AnnouncementChannel,

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_status", nullable = false, length = 20)
    var status: AnnouncementDeliveryStatus = AnnouncementDeliveryStatus.PENDING,

    @Column(name = "attempt_count", nullable = false)
    var attemptCount: Int = 0,

    @Column(name = "destination_masked", length = 250)
    var destinationMasked: String? = null,

    @Column(name = "provider_reference", length = 250)
    var providerReference: String? = null,

    @Column(name = "last_attempt_at")
    var lastAttemptAt: Instant? = null,

    @Column(name = "delivered_at")
    var deliveredAt: Instant? = null,

    @Column(name = "read_at")
    var readAt: Instant? = null,

    @Column(name = "last_error", length = 1000)
    var lastError: String? = null,
) : BaseEntity()
