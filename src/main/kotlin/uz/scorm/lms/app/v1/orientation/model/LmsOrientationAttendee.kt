package uz.scorm.lms.app.v1.orientation.model

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
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant

@Entity
@Table(
    name = "lms_orientation_attendees",
    indexes = [
        Index(name = "idx_lms_orientation_attendee_session", columnList = "session_id,attendance_status"),
        Index(name = "idx_lms_orientation_attendee_student", columnList = "student_id,acknowledgement_at"),
    ],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_lms_orientation_attendee", columnNames = ["session_id", "student_id"]),
    ],
)
class LmsOrientationAttendee(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    var session: LmsOrientationSession,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    var student: StudentProfile,

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status", nullable = false, length = 20)
    var attendanceStatus: LmsOrientationAttendanceStatus = LmsOrientationAttendanceStatus.INVITED,

    @Column(name = "checked_in_at")
    var checkedInAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checked_in_by_user_id")
    var checkedInByUser: User? = null,

    @Column(name = "acknowledgement_at")
    var acknowledgementAt: Instant? = null,

    @Column(name = "acknowledgement_version", length = 50)
    var acknowledgementVersion: String? = null,
) : BaseEntity()

enum class LmsOrientationAttendanceStatus {
    INVITED, PRESENT, ABSENT, EXCUSED
}

