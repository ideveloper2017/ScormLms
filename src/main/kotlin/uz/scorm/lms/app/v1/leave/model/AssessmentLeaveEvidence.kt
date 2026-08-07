package uz.scorm.lms.app.v1.leave.model

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
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant
import java.time.LocalDate

@Entity
@Table(
    name = "assessment_leave_evidence",
    indexes = [
        Index(name = "idx_assessment_leave_student_year", columnList = "student_id,academic_year"),
        Index(name = "idx_assessment_leave_status_period", columnList = "status,leave_start_date,leave_end_date"),
    ],
)
class AssessmentLeaveEvidence(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    var student: StudentProfile,

    @Column(name = "academic_year", nullable = false, length = 20)
    var academicYear: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "leave_purpose", nullable = false, length = 40)
    var leavePurpose: AssessmentLeavePurpose,

    @Column(name = "assessment_reference", nullable = false, length = 1000)
    var assessmentReference: String,

    @Column(name = "employer_name", nullable = false, length = 500)
    var employerName: String,

    @Column(name = "job_title", nullable = false, length = 300)
    var jobTitle: String,

    @Column(name = "employment_document_reference", nullable = false, length = 1000)
    var employmentDocumentReference: String,

    @Column(name = "leave_order_number", nullable = false, length = 200)
    var leaveOrderNumber: String,

    @Column(name = "leave_order_date", nullable = false)
    var leaveOrderDate: LocalDate,

    @Column(name = "leave_start_date", nullable = false)
    var leaveStartDate: LocalDate,

    @Column(name = "leave_end_date", nullable = false)
    var leaveEndDate: LocalDate,

    @Column(name = "salary_retention_confirmed", nullable = false)
    var salaryRetentionConfirmed: Boolean,

    @Column(name = "evidence_reference", nullable = false, length = 1000)
    var evidenceReference: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: AssessmentLeaveStatus = AssessmentLeaveStatus.DRAFT,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    var createdByUser: User,

    @Column(name = "verified_at")
    var verifiedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_user_id")
    var verifiedByUser: User? = null,

    @Column(name = "verification_note", length = 2000)
    var verificationNote: String? = null,

    @Column(name = "rejected_at")
    var rejectedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejected_by_user_id")
    var rejectedByUser: User? = null,

    @Column(name = "rejection_reason", length = 2000)
    var rejectionReason: String? = null,
) : BaseEntity()

enum class AssessmentLeavePurpose {
    SEMESTER_FINAL_ASSESSMENT,
    STATE_ATTESTATION,
    BACHELOR_THESIS_DEFENSE,
    MASTER_THESIS_DEFENSE,
}

enum class AssessmentLeaveStatus { DRAFT, VERIFIED, REJECTED }
