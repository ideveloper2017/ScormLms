package uz.scorm.lms.app.v1.attestation.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

@Entity
@Table(
    name = "state_attestation_sessions",
    indexes = [
        Index(name = "idx_attestation_session_course", columnList = "course_id,exam_date"),
        Index(name = "idx_attestation_session_chair", columnList = "commission_chair_id,exam_date"),
        Index(name = "idx_attestation_session_status", columnList = "status,exam_date"),
    ],
)
class StateAttestationSession(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    var course: Course,

    @Column(name = "semester_id")
    var semesterId: Long? = null,

    @Column(nullable = false, length = 255)
    var title: String,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "exam_date", nullable = false)
    var examDate: LocalDate,

    @Column(name = "exam_time", nullable = false)
    var examTime: LocalTime,

    @Column(nullable = false, length = 255)
    var location: String,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "commission_chair_id", nullable = false)
    var commissionChair: User,

    @Enumerated(EnumType.STRING)
    @Column(name = "defense_type", nullable = false, length = 30)
    var defenseType: DefenseType = DefenseType.BACHELOR,

    @Column(name = "min_commission_members", nullable = false)
    var minCommissionMembers: Int = 3,

    @Column(name = "min_pass_score", nullable = false)
    var minPassScore: Int = 60,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: AttestationSessionStatus = AttestationSessionStatus.DRAFT,

    @Column(name = "published_at")
    var publishedAt: Instant? = null,

    @Column(name = "held_at")
    var heldAt: Instant? = null,

    @Column(name = "result_published_at")
    var resultPublishedAt: Instant? = null,
) : BaseEntity()

enum class DefenseType {
    BACHELOR, MASTER
}

enum class AttestationSessionStatus {
    DRAFT, PUBLISHED, ONGOING, COMPLETED
}