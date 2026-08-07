package uz.scorm.lms.app.v1.orientation.model

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
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant

@Entity
@Table(
    name = "lms_orientation_sessions",
    indexes = [
        Index(name = "idx_lms_orientation_status_date", columnList = "status,starts_at"),
        Index(name = "idx_lms_orientation_scope", columnList = "program_id,group_id,academic_year"),
    ],
)
class LmsOrientationSession(
    @Column(nullable = false, length = 255)
    var title: String,

    @Column(nullable = false, length = 255)
    var venue: String,

    @Column(name = "academic_year", nullable = false, length = 20)
    var academicYear: String,

    @Column(name = "starts_at", nullable = false)
    var startsAt: Instant,

    @Column(name = "ends_at", nullable = false)
    var endsAt: Instant,

    @Column(columnDefinition = "TEXT")
    var instructions: String? = null,

    @Column(name = "program_id")
    var programId: Long? = null,

    @Column(name = "group_id")
    var groupId: Long? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: LmsOrientationSessionStatus = LmsOrientationSessionStatus.DRAFT,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    var createdByUser: User,

    @Column(name = "published_at")
    var publishedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "published_by_user_id")
    var publishedByUser: User? = null,

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completed_by_user_id")
    var completedByUser: User? = null,

    @Column(name = "cancelled_at")
    var cancelledAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by_user_id")
    var cancelledByUser: User? = null,
) : BaseEntity()

enum class LmsOrientationSessionStatus {
    DRAFT, PUBLISHED, COMPLETED, CANCELLED
}

