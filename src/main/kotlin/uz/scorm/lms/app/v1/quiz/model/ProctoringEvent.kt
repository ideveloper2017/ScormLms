package uz.scorm.lms.app.v1.quiz.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import uz.scorm.lms.app.common.BaseEntity
import java.time.Instant

@Entity
@Table(
    name = "proctoring_events",
    uniqueConstraints = [UniqueConstraint(
        name = "uk_proctoring_event_key",
        columnNames = ["session_id", "event_key"],
    )],
    indexes = [
        Index(name = "idx_proctoring_event_attempt_time", columnList = "attempt_id,occurred_at"),
        Index(name = "idx_proctoring_event_risk", columnList = "severity,occurred_at"),
    ],
)
class ProctoringEvent(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    var session: ProctoringSession,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    var attempt: QuizAttempt,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    var type: ProctoringEventType,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    var severity: ProctoringEventSeverity,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    var source: ProctoringEventSource,

    @Column(name = "event_key", nullable = false, length = 80)
    var eventKey: String,

    @Column(name = "occurred_at", nullable = false)
    var occurredAt: Instant,
) : BaseEntity()

enum class ProctoringEventType {
    SESSION_STARTED,
    SESSION_ENDED,
    CAMERA_STARTED,
    CAMERA_STOPPED,
    CAMERA_PERMISSION_DENIED,
    TAB_HIDDEN,
    TAB_VISIBLE,
    WINDOW_BLURRED,
    WINDOW_FOCUSED,
    NETWORK_OFFLINE,
    NETWORK_ONLINE,
    HEARTBEAT,
    PAGE_EXIT,
}

enum class ProctoringEventSeverity { INFO, LOW, MEDIUM, HIGH, CRITICAL }

enum class ProctoringEventSource { SERVER, CLIENT }
