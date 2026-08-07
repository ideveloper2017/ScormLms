package uz.scorm.lms.app.v1.attestation.model

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
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

@Entity
@Table(
    name = "student_defenses",
    indexes = [
        Index(name = "idx_student_defense_session", columnList = "attestation_session_id,defense_status"),
        Index(name = "idx_student_defense_enrollment", columnList = "enrollment_id"),
    ],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_student_defense", columnNames = ["attestation_session_id", "enrollment_id"]),
    ],
)
class StudentDefense(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attestation_session_id", nullable = false)
    var attestationSession: StateAttestationSession,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false)
    var enrollment: CourseEnrollment,

    @Enumerated(EnumType.STRING)
    @Column(name = "defense_status", nullable = false, length = 20)
    var defenseStatus: DefenseStatus = DefenseStatus.SCHEDULED,

    @Column(name = "defense_date")
    var defenseDate: LocalDate? = null,

    @Column(name = "defense_time")
    var defenseTime: LocalTime? = null,

    @Column(name = "presentation_file_url", length = 500)
    var presentationFileUrl: String? = null,

    @Column(name = "presentation_file_name", length = 255)
    var presentationFileName: String? = null,

    @Column(name = "defense_notes", columnDefinition = "TEXT")
    var defenseNotes: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "commission_decision", length = 20)
    var commissionDecision: DefenseDecision? = null,

    @Column(name = "commission_score", nullable = false)
    var commissionScore: BigDecimal = BigDecimal.ZERO,

    @Column(name = "total_graders", nullable = false)
    var totalGraders: Int = 0,

    @Column(name = "onsite_attendance_required", nullable = false)
    var onsiteAttendanceRequired: Boolean = true,

    @Column(name = "onsite_attendance_confirmed_at")
    var onsiteAttendanceConfirmedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "onsite_attendance_confirmed_by")
    var onsiteAttendanceConfirmedBy: User? = null,
) : BaseEntity()

enum class DefenseStatus {
    SCHEDULED,   // Rejada
    DEFENDED,    // Himoya o'tkazildi
    CANCELLED,   // Bekor qilindi
    RESCHEDULED, // Qayta rejalashtrildi
}

enum class DefenseDecision {
    PASS,    // O'tdi
    FAIL,    // O'tmadi
    RETAKE,  // Qayta himoya talab etiladi
}
