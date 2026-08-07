package uz.scorm.lms.app.v1.admission.model

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
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.user.model.User
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

@Entity
@Table(
    name = "distance_admission_policies",
    indexes = [Index(name = "idx_admission_policy_program_year_status", columnList = "program_id,academic_year,status")],
    uniqueConstraints = [UniqueConstraint(name = "uq_admission_policy_program_year_version", columnNames = ["program_id", "academic_year", "version_code"])],
)
class DistanceAdmissionPolicy(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "program_id", nullable = false)
    var program: Program,

    @Column(name = "academic_year", nullable = false, length = 9)
    var academicYear: String,

    @Column(name = "version_code", nullable = false, length = 100)
    var versionCode: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "institution_governance_type", nullable = false, length = 40)
    var institutionGovernanceType: InstitutionGovernanceType,

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_authority_type", nullable = false, length = 40)
    var approvalAuthorityType: ApprovalAuthorityType,

    @Column(name = "institution_name", nullable = false, length = 500)
    var institutionName: String,

    @Column(name = "approving_authority_name", nullable = false, length = 500)
    var approvingAuthorityName: String,

    @Column(name = "admission_quota", nullable = false)
    var admissionQuota: Int,

    @Column(name = "contract_amount", nullable = false, precision = 16, scale = 2)
    var contractAmount: BigDecimal,

    @Column(nullable = false, length = 3)
    var currency: String = "UZS",

    @Column(name = "higher_education_ministry_agreement_reference", length = 1000)
    var higherEducationMinistryAgreementReference: String? = null,

    @Column(name = "economy_ministry_agreement_reference", length = 1000)
    var economyMinistryAgreementReference: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: AdmissionPolicyStatus = AdmissionPolicyStatus.DRAFT,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    var createdByUser: User,

    @Column(name = "approval_document_number", length = 200)
    var approvalDocumentNumber: String? = null,

    @Column(name = "approval_document_date")
    var approvalDocumentDate: LocalDate? = null,

    @Column(name = "approval_document_reference", length = 1000)
    var approvalDocumentReference: String? = null,

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

enum class InstitutionGovernanceType {
    STATE_STANDARD,
    STATE_FINANCIALLY_AUTONOMOUS,
    NON_STATE,
}

enum class ApprovalAuthorityType {
    SUBORDINATE_MINISTRY_AGENCY,
    SUPERVISORY_BOARD,
    FOUNDER,
}

enum class AdmissionPolicyStatus {
    DRAFT,
    APPROVED,
    ARCHIVED,
}
