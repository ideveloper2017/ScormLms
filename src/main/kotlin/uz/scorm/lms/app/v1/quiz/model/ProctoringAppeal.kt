package uz.scorm.lms.app.v1.quiz.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.JoinTable
import jakarta.persistence.ManyToMany
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant

@Entity
@Table(
    name = "proctoring_appeals",
    uniqueConstraints = [UniqueConstraint(name = "uk_proctoring_appeal_attempt", columnNames = ["attempt_id"])],
    indexes = [
        Index(name = "idx_proctoring_appeal_student", columnList = "student_id,requested_at"),
        Index(name = "idx_proctoring_appeal_status", columnList = "status,requested_at"),
    ],
)
class ProctoringAppeal(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    var attempt: QuizAttempt,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    var student: User,

    @Column(nullable = false, columnDefinition = "TEXT")
    var reason: String,

    @Column(name = "requested_at", nullable = false)
    var requestedAt: Instant,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    var status: ProctoringAppealStatus = ProctoringAppealStatus.PENDING,

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "proctoring_appeal_events",
        joinColumns = [JoinColumn(name = "appeal_id")],
        inverseJoinColumns = [JoinColumn(name = "event_id")],
    )
    var disputedEvents: MutableSet<ProctoringEvent> = linkedSetOf(),

    @Column(name = "reviewed_at")
    var reviewedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    var reviewedBy: User? = null,

    @Column(columnDefinition = "TEXT")
    var decision: String? = null,
) : BaseEntity()

enum class ProctoringAppealStatus { PENDING, APPROVED, PARTIAL, REJECTED }
