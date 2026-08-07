package uz.scorm.lms.app.v1.support.model

import jakarta.persistence.*
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant

enum class SupportCategory { TECHNICAL, ACCESS, CONTENT, ASSESSMENT, OTHER }
enum class SupportImpact { LIMITED, MULTIPLE_USERS, SERVICE_BLOCKED, SECURITY }
enum class SupportPriority { LOW, NORMAL, HIGH, URGENT }
enum class SupportTicketStatus { OPEN, IN_PROGRESS, WAITING_REQUESTER, RESOLVED, CLOSED, CANCELLED }
enum class SupportEventType { CREATED, ASSIGNED, COMMENT, STATUS_CHANGED, RESOLVED, CLOSED, REOPENED, CANCELLED }
enum class SupportEventVisibility { PUBLIC, INTERNAL }

@Entity
@Table(name = "support_tickets")
class SupportTicket(
    @Column(name = "ticket_code", nullable = false, unique = true, length = 40)
    var ticketCode: String,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_user_id", nullable = false)
    var requester: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_user_id")
    var assignee: User? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    var course: Course? = null,

    @Column(nullable = false, length = 250)
    var subject: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    var description: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    var category: SupportCategory,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    var impact: SupportImpact,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var priority: SupportPriority,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    var status: SupportTicketStatus = SupportTicketStatus.OPEN,

    @Column(name = "sla_policy_version", nullable = false, length = 20)
    var slaPolicyVersion: String = "1.0",

    @Column(name = "response_due_at", nullable = false)
    var responseDueAt: Instant,

    @Column(name = "resolution_due_at", nullable = false)
    var resolutionDueAt: Instant,

    @Column(name = "first_responded_at")
    var firstRespondedAt: Instant? = null,

    @Column(name = "sla_paused_at")
    var slaPausedAt: Instant? = null,

    @Column(name = "sla_paused_seconds", nullable = false)
    var slaPausedSeconds: Long = 0,

    @Column(name = "resolved_at")
    var resolvedAt: Instant? = null,

    @Column(name = "resolution_summary", columnDefinition = "TEXT")
    var resolutionSummary: String? = null,

    @Column(name = "closed_at")
    var closedAt: Instant? = null,

    @Column(name = "cancelled_at")
    var cancelledAt: Instant? = null,

    @Column(name = "last_activity_at", nullable = false)
    var lastActivityAt: Instant,

    @Version
    @Column(nullable = false)
    var version: Long = 0,
) : BaseEntity()

@Entity
@Table(name = "support_ticket_events", uniqueConstraints = [
    UniqueConstraint(name = "uk_support_ticket_event_sequence", columnNames = ["ticket_id", "sequence_no"]),
])
class SupportTicketEvent(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    var ticket: SupportTicket,

    @Column(name = "sequence_no", nullable = false)
    var sequenceNo: Int,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_user_id", nullable = false)
    var actor: User,

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 30)
    var eventType: SupportEventType,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var visibility: SupportEventVisibility = SupportEventVisibility.PUBLIC,

    @Column(columnDefinition = "TEXT")
    var body: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    var fromStatus: SupportTicketStatus? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", length = 30)
    var toStatus: SupportTicketStatus? = null,

    @Column(name = "occurred_at", nullable = false)
    var occurredAt: Instant = Instant.now(),
) : BaseEntity()
