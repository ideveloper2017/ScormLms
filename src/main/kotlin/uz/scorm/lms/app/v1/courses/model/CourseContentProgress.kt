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
    name = "course_content_progress",
    uniqueConstraints = [UniqueConstraint(
        name = "uk_course_content_progress",
        columnNames = ["enrollment_id", "content_id"],
    )],
    indexes = [
        Index(name = "idx_content_progress_enrollment", columnList = "enrollment_id"),
        Index(name = "idx_content_progress_content", columnList = "content_id"),
    ],
)
class CourseContentProgress(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false)
    var enrollment: CourseEnrollment,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "content_id", nullable = false)
    var content: CourseContent,

    @Column(nullable = false)
    var progress: Int = 0,

    @Column(name = "first_accessed_at", nullable = false)
    var firstAccessedAt: Instant = Instant.now(),

    @Column(name = "last_accessed_at", nullable = false)
    var lastAccessedAt: Instant = Instant.now(),

    @Column(name = "completed_at")
    var completedAt: Instant? = null,
) : BaseEntity()
