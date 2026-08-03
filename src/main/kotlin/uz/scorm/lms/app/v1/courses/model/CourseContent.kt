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

    @Column(name = "duration_minutes")
    var durationMinutes: Int? = null,

    @Column(nullable = false)
    var position: Int = 1,

    @Column(nullable = false, length = 20)
    var status: String = LearningItemStatus.DRAFT.name,

    @Column(name = "published_at")
    var publishedAt: Instant? = null,
) : BaseEntity()

enum class CourseContentType {
    VIDEO,
    DOCUMENT,
    LINK,
    FILE,
}
