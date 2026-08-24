package uz.scorm.lms.app.v1.curriculum.model

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
import uz.scorm.lms.app.v1.academicresult.model.RatingSystem
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.student.model.EducationForm
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant
import java.time.LocalDate

@Entity
@Table(
    name = "program_curriculum_versions",
    indexes = [
        Index(name = "idx_curriculum_program_year_status", columnList = "program_id,academic_year,status"),
        Index(name = "idx_curriculum_status_validity", columnList = "status,valid_from,valid_until"),
    ],
    uniqueConstraints = [UniqueConstraint(name = "uq_curriculum_program_version", columnNames = ["program_id", "version_code"])],
)
class ProgramCurriculumVersion(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "program_id", nullable = false)
    var program: Program,

    @Column(name = "version_code", nullable = false, length = 100)
    var versionCode: String,

    @Column(name = "academic_year", nullable = false, length = 20)
    var academicYear: String,

    @Column(nullable = false, length = 500)
    var name: String,

    @Column(nullable = false)
    var active: Boolean = true,

    @Column(name = "education_language", nullable = false, length = 20)
    var educationLanguage: String = "uz",

    @Column(name = "passing_score", nullable = false)
    var passingScore: Int = 60,

    @Column(name = "base_credit_amount", nullable = false)
    var baseCreditAmount: Long = 0,

    @Enumerated(EnumType.STRING)
    @Column(name = "education_form", nullable = false, length = 30)
    var educationForm: EducationForm = EducationForm.DISTANCE,

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "rating_system_id", nullable = false)
    var ratingSystem: RatingSystem,

    @Column(name = "semester_count", nullable = false)
    var semesterCount: Int = 8,

    @Enumerated(EnumType.STRING)
    @Column(name = "credential_type", nullable = false, length = 30)
    var credentialType: CurriculumCredentialType,

    @Enumerated(EnumType.STRING)
    @Column(name = "normative_basis_type", nullable = false, length = 40)
    var normativeBasisType: CurriculumNormativeBasisType,

    @Column(name = "standard_reference", nullable = false, length = 1000)
    var standardReference: String,

    @Column(name = "qualification_requirements_reference", nullable = false, length = 1000)
    var qualificationRequirementsReference: String,

    @Column(name = "valid_from", nullable = false)
    var validFrom: LocalDate,

    @Column(name = "valid_until", nullable = false)
    var validUntil: LocalDate,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: CurriculumStatus = CurriculumStatus.DRAFT,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    var createdByUser: User,

    @Column(name = "approval_order_number", length = 200)
    var approvalOrderNumber: String? = null,

    @Column(name = "approval_order_date")
    var approvalOrderDate: LocalDate? = null,

    @Column(name = "approved_at")
    var approvedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_user_id")
    var approvedByUser: User? = null,

    @Column(name = "archived_at")
    var archivedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "archived_by_user_id")
    var archivedByUser: User? = null,
) : BaseEntity()

enum class CurriculumCredentialType {
    STATE_DIPLOMA,
    NON_STATE_CREDENTIAL,
}

enum class CurriculumNormativeBasisType {
    STATE_EDUCATION_STANDARD,
    PROFESSIONAL_STANDARD,
}

enum class CurriculumStatus {
    DRAFT,
    APPROVED,
    ARCHIVED,
}
