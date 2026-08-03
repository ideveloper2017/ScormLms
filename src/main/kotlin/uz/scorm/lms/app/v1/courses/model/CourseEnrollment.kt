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
import uz.scorm.lms.app.v1.student.model.StudentProfile
import java.time.Instant

@Entity
@Table(
    name = "course_enrollments",
    uniqueConstraints = [UniqueConstraint(name = "uk_course_enrollment", columnNames = ["course_id", "student_id"])],
    indexes = [
        Index(name = "idx_course_enrollment_course", columnList = "course_id,status"),
        Index(name = "idx_course_enrollment_student", columnList = "student_id,status"),
    ],
)
class CourseEnrollment(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    var course: Course,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    var student: StudentProfile,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: CourseEnrollmentStatus = CourseEnrollmentStatus.ACTIVE,

    @Column(nullable = false)
    var progress: Int = 0,

    @Column(name = "academic_year", nullable = false, length = 20)
    var academicYear: String = "",

    @Column(nullable = false)
    var semester: Int = 1,

    @Column(nullable = false)
    var credits: Int = 0,

    @Column(nullable = false)
    var required: Boolean = true,

    @Column(name = "enrolled_at", nullable = false)
    var enrolledAt: Instant = Instant.now(),

    @Column(name = "completed_at")
    var completedAt: Instant? = null,
) : BaseEntity()

enum class CourseEnrollmentStatus {
    ACTIVE,
    COMPLETED,
    WITHDRAWN,
}
