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
import jakarta.persistence.UniqueConstraint
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant

@Entity
@Table(
    name = "exam_attendance",
    indexes = [
        Index(name = "idx_exam_attendance_session", columnList = "exam_session_id,attendance_status"),
        Index(name = "idx_exam_attendance_enrollment", columnList = "enrollment_id,attendance_status"),
        Index(name = "idx_exam_attendance_verified", columnList = "attendance_verified_by,verification_time"),
    ],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_exam_attendance_unique", columnNames = ["exam_session_id", "enrollment_id"]),
    ],
)
class ExamAttendance(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exam_session_id", nullable = false)
    var examSession: ExamSession,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false)
    var enrollment: CourseEnrollment,

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status", nullable = false, length = 20)
    var attendanceStatus: AttendanceStatus = AttendanceStatus.EXPECTED,

    @Column(name = "arrival_time")
    var arrivalTime: Instant? = null,

    @Column(name = "departure_time")
    var departureTime: Instant? = null,

    @Column(name = "special_conditions", length = 255)
    var specialConditions: String? = null,

    @Column(name = "proctor_notes", columnDefinition = "TEXT")
    var proctorNotes: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attendance_verified_by")
    var attendanceVerifiedBy: User? = null,

    @Column(name = "verification_time")
    var verificationTime: Instant? = null,
) : BaseEntity()

enum class AttendanceStatus {
    EXPECTED,    // Student is expected to attend
    PRESENT,     // Student attended on time
    LATE,        // Student attended late
    ABSENT,      // Student did not attend
    EXCUSE,      // Student requested excuse
    EXCUSED,     // Absence has been excused
}