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
import jakarta.persistence.UniqueConstraint
import uz.scorm.lms.app.common.BaseEntity
import java.time.Instant
import java.time.LocalDate

@Entity
@Table(
    name = "course_content_revisions",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_content_revision_number", columnNames = ["content_id", "revision_number"]),
        UniqueConstraint(name = "uk_content_revision_version", columnNames = ["content_id", "content_version"]),
    ],
    indexes = [Index(name = "idx_content_revision_time", columnList = "content_id,changed_at")],
)
class CourseContentRevision(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "content_id", nullable = false)
    var content: CourseContent,

    @Column(name = "revision_number", nullable = false)
    var revisionNumber: Int,

    @Column(nullable = false)
    var title: String,

    @Column(columnDefinition = "TEXT")
    var description: String?,

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 20)
    var contentType: CourseContentType,

    @Column(name = "content_url", length = 2000)
    var contentUrl: String?,

    @Column(name = "duration_minutes")
    var durationMinutes: Int?,

    @Column(name = "language_code", nullable = false, length = 35)
    var languageCode: String,

    @Column(name = "author_name", nullable = false)
    var authorName: String,

    @Column(name = "content_version", nullable = false, length = 64)
    var contentVersion: String,

    @Column(name = "source_name", nullable = false, length = 500)
    var sourceName: String,

    @Column(name = "source_url", length = 2000)
    var sourceUrl: String?,

    @Column(name = "valid_from", nullable = false)
    var validFrom: LocalDate,

    @Column(name = "valid_until")
    var validUntil: LocalDate?,

    @Column(name = "changed_at", nullable = false)
    var changedAt: Instant,

    @Column(name = "changed_by", nullable = false)
    var changedBy: Long,
) : BaseEntity()
