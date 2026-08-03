package uz.scorm.lms.app.v1.attendance.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.courses.model.Course
import java.time.Instant

@Entity
@Table(
    name = "course_attendance_sessions",
    indexes = [
        Index(name = "idx_attendance_session_course_time", columnList = "course_id,opens_at,closes_at"),
    ],
)
class CourseAttendanceSession(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    var course: Course,

    @Column(nullable = false, length = 255)
    var title: String,

    @Column(name = "opens_at", nullable = false)
    var opensAt: Instant,

    @Column(name = "closes_at", nullable = false)
    var closesAt: Instant,

    @Column(name = "late_after")
    var lateAfter: Instant? = null,

    @Column(name = "minimum_activity_seconds", nullable = false)
    var minimumActivitySeconds: Int = 0,
) : BaseEntity()
