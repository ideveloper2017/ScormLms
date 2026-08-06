package uz.scorm.lms.app.v1.courses.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
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
    name = "course_content_reviews",
    uniqueConstraints = [UniqueConstraint(
        name = "uk_content_review_revision",
        columnNames = ["content_id", "revision_number"],
    )],
    indexes = [Index(name = "idx_content_review_queue", columnList = "status,submitted_at")],
)
class CourseContentReview(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "content_id", nullable = false)
    var content: CourseContent,

    @Column(name = "revision_number", nullable = false)
    var revisionNumber: Int,

    @Column(name = "content_version", nullable = false, length = 64)
    var contentVersion: String,

    @Column(nullable = false, length = 30)
    var status: String = "PENDING",

    @Column(name = "submitted_at", nullable = false)
    var submittedAt: Instant,

    @Column(name = "submitted_by", nullable = false)
    var submittedBy: Long,

    @Column(name = "reviewed_at")
    var reviewedAt: Instant? = null,

    @Column(name = "reviewed_by")
    var reviewedBy: Long? = null,

    @Column(name = "decision_comment", length = 2000)
    var decisionComment: String? = null,
) : BaseEntity()
