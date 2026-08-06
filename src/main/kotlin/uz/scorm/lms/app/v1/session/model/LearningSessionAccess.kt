package uz.scorm.lms.app.v1.session.model

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

enum class LearningSessionAccessType { LIVE_JOIN, RECORDING_OPEN, RESOURCE_OPEN }

@Entity
@Table(
    name = "learning_session_accesses",
    indexes = [
        Index(name = "idx_session_access_session_time", columnList = "session_id,occurred_at"),
        Index(name = "idx_session_access_enrollment", columnList = "enrollment_id,occurred_at"),
    ],
)
class LearningSessionAccess(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    var session: CourseLearningSession,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false)
    var enrollment: CourseEnrollment,

    @Enumerated(EnumType.STRING)
    @Column(name = "access_type", nullable = false, length = 30)
    var accessType: LearningSessionAccessType,

    @Column(name = "occurred_at", nullable = false)
    var occurredAt: Instant = Instant.now(),

    @Column(name = "duration_seconds", nullable = false)
    var durationSeconds: Int = 0,
) : BaseEntity()
