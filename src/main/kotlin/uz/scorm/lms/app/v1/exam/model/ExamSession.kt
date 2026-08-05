package uz.scorm.lms.app.v1.exam.model

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
    name = "exam_sessions",
    indexes = [
        Index(name = "idx_exam_session_course", columnList = "course_id,exam_date"),
        Index(name = "idx_exam_session_examiner", columnList = "examiner_id,exam_date"),
        Index(name = "idx_exam_session_status", columnList = "status,exam_date"),
    ],
)
class ExamSession(
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

    @Column(name = "max_capacity")
    var maxCapacity: Int? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "examiner_id", nullable = false)
    var examiner: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "secondary_examiner_id")
    var secondaryExaminer: User? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_type", nullable = false, length = 30)
    var examType: ExamType = ExamType.WRITTEN,

    @Column(name = "duration_minutes", nullable = false)
    var durationMinutes: Int = 120,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: ExamSessionStatus = ExamSessionStatus.DRAFT,

    @Column(name = "published_at")
    var publishedAt: Instant? = null,

    @Column(name = "held_at")
    var heldAt: Instant? = null,
) : BaseEntity()

enum class ExamType {
    WRITTEN, ORAL, PRACTICAL, HYBRID
}

enum class ExamSessionStatus {
    DRAFT, PUBLISHED, ONGOING, COMPLETED
}