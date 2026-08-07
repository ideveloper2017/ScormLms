package uz.scorm.lms.app.v1.practice.model

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
    name = "student_practice_placements",
    indexes = [
        Index(name = "idx_practice_student_period", columnList = "student_id,starts_on,ends_on"),
        Index(name = "idx_practice_status_year", columnList = "status,academic_year"),
    ],
)
class StudentPracticePlacement(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    var student: StudentProfile,

    @Column(name = "academic_year", nullable = false, length = 20)
    var academicYear: String,

    @Column(name = "plan_reference", nullable = false, length = 500)
    var planReference: String,

    @Column(name = "starts_on", nullable = false)
    var startsOn: LocalDate,

    @Column(name = "ends_on", nullable = false)
    var endsOn: LocalDate,

    @Enumerated(EnumType.STRING)
    @Column(name = "placement_basis", nullable = false, length = 30)
    var placementBasis: PracticePlacementBasis,

    @Column(name = "organization_name", nullable = false, length = 500)
    var organizationName: String,

    @Column(name = "organization_address", nullable = false, length = 1000)
    var organizationAddress: String,

    @Column(name = "job_title", length = 300)
    var jobTitle: String? = null,

    @Column(name = "specialty_match_confirmed", nullable = false)
    var specialtyMatchConfirmed: Boolean = false,

    @Column(name = "agreement_number", length = 200)
    var agreementNumber: String? = null,

    @Column(name = "agreement_date")
    var agreementDate: LocalDate? = null,

    @Column(name = "basis_evidence_reference", nullable = false, length = 1000)
    var basisEvidenceReference: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: StudentPracticeStatus = StudentPracticeStatus.DRAFT,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    var createdByUser: User,

    @Column(name = "approved_at")
    var approvedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_user_id")
    var approvedByUser: User? = null,

    @Column(name = "completion_summary", columnDefinition = "TEXT")
    var completionSummary: String? = null,

    @Column(name = "completion_evidence_reference", length = 1000)
    var completionEvidenceReference: String? = null,

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completed_by_user_id")
    var completedByUser: User? = null,

    @Column(name = "cancelled_at")
    var cancelledAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by_user_id")
    var cancelledByUser: User? = null,
) : BaseEntity()

enum class PracticePlacementBasis {
    CURRENT_WORKPLACE,
    PARTNER_ORGANIZATION,
}

enum class StudentPracticeStatus {
    DRAFT,
    APPROVED,
    COMPLETED,
    CANCELLED,
}

