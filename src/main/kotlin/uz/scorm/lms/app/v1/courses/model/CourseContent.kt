package uz.scorm.lms.app.v1.courses.model

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
import java.time.Instant
import java.time.LocalDate

@Entity
@Table(
    name = "course_contents",
    indexes = [Index(name = "idx_course_content_order", columnList = "module_id,position")],
)
class CourseContent(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "module_id", nullable = false)
    var module: CourseModule,

    @Column(nullable = false)
    var title: String,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 20)
    var contentType: CourseContentType,

    @Column(name = "content_url", length = 2000)
    var contentUrl: String? = null,

    @Column(name = "content_body", columnDefinition = "TEXT")
    var contentBody: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id")
    var asset: CourseContentAsset? = null,

    @Column(name = "duration_minutes")
    var durationMinutes: Int? = null,

    @Column(nullable = false)
    var position: Int = 1,

    @Column(nullable = false, length = 20)
    var status: String = LearningItemStatus.DRAFT.name,

    @Column(name = "published_at")
    var publishedAt: Instant? = null,

    @Column(name = "language_code", nullable = false, length = 35)
    var languageCode: String,

    @Column(name = "author_name", nullable = false)
    var authorName: String,

    @Column(name = "content_version", nullable = false, length = 64)
    var contentVersion: String,

    @Column(name = "source_name", nullable = false, length = 500)
    var sourceName: String,

    @Column(name = "source_url", length = 2000)
    var sourceUrl: String? = null,

    @Column(name = "valid_from", nullable = false)
    var validFrom: LocalDate,

    @Column(name = "valid_until")
    var validUntil: LocalDate? = null,

    @Column(name = "metadata_updated_at", nullable = false)
    var metadataUpdatedAt: Instant,

    @Column(name = "review_status", nullable = false, length = 30)
    var reviewStatus: String = ContentReviewStatus.DRAFT.name,

    @Column(name = "approved_revision_number")
    var approvedRevisionNumber: Int? = null,
) : BaseEntity()

fun CourseContent.isEffective(onDate: LocalDate = LocalDate.now()): Boolean =
    !onDate.isBefore(validFrom) && (validUntil == null || !onDate.isAfter(validUntil))

enum class CourseContentType {
    VIDEO,
    DOCUMENT,
    LINK,
    FILE,
    TEXT,
}

enum class ContentReviewStatus {
    DRAFT,
    IN_REVIEW,
    APPROVED,
    CHANGES_REQUESTED,
}

enum class ContentReviewDecision {
    APPROVED,
    CHANGES_REQUESTED,
}
