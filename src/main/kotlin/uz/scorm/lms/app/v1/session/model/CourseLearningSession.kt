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
import uz.scorm.lms.app.v1.courses.model.Course
import java.time.Instant

enum class LearningSessionFormat { SYNCHRONOUS, ASYNCHRONOUS }
enum class LearningSessionType { LECTURE, LAB, SEMINAR, TUTORIAL }
enum class LearningSessionStatus { DRAFT, PUBLISHED, CANCELLED, COMPLETED }

@Entity
@Table(
    name = "course_learning_sessions",
    indexes = [
        Index(name = "idx_learning_session_course_time", columnList = "course_id,starts_at,ends_at"),
        Index(name = "idx_learning_session_status_time", columnList = "status,starts_at"),
    ],
)
class CourseLearningSession(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    var course: Course,

    @Column(nullable = false, length = 255)
    var title: String,

    @Column(columnDefinition = "TEXT", nullable = false)
    var description: String = "",

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    var format: LearningSessionFormat,

    @Enumerated(EnumType.STRING)
    @Column(name = "session_type", nullable = false, length = 30)
    var sessionType: LearningSessionType,

    @Column(name = "starts_at", nullable = false)
    var startsAt: Instant,

    @Column(name = "ends_at", nullable = false)
    var endsAt: Instant,

    @Column(length = 255)
    var room: String? = null,

    @Column(length = 255)
    var building: String? = null,

    @Column(name = "live_url", length = 1000)
    var liveUrl: String? = null,

    @Column(name = "recording_url", length = 1000)
    var recordingUrl: String? = null,

    @Column(name = "resource_url", length = 1000)
    var resourceUrl: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: LearningSessionStatus = LearningSessionStatus.DRAFT,

    @Column(name = "published_at")
    var publishedAt: Instant? = null,
) : BaseEntity()
