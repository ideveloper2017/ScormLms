package uz.scorm.lms.app.v1.attendance.model

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
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import java.time.Instant

enum class LearningActivityType {
    CONTENT_VIEWED,
    CONTENT_COMPLETED,
    SCORM_LAUNCHED,
    SCORM_COMMITTED,
    SCORM_FINISHED,
    QUIZ_STARTED,
    QUIZ_SUBMITTED,
}

enum class LearningActivitySource {
    COURSE_CONTENT,
    SCORM_PACKAGE,
    QUIZ,
}

@Entity
@Table(
    name = "learning_activity_events",
    indexes = [
        Index(name = "idx_learning_activity_enrollment_time", columnList = "enrollment_id,occurred_at"),
        Index(name = "idx_learning_activity_source", columnList = "source_type,source_id"),
    ],
)
class LearningActivityEvent(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false)
    var enrollment: CourseEnrollment,

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 30)
    var eventType: LearningActivityType,

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 30)
    var sourceType: LearningActivitySource,

    @Column(name = "source_id", nullable = false)
    var sourceId: Long,

    @Column(name = "duration_seconds", nullable = false)
    var durationSeconds: Int = 0,

    @Column(name = "occurred_at", nullable = false)
    var occurredAt: Instant = Instant.now(),
) : BaseEntity()
