package uz.scorm.lms.app.v1.admission.dto

import uz.scorm.lms.app.v1.admission.model.ApprovalAuthorityType
import uz.scorm.lms.app.v1.admission.model.InstitutionGovernanceType
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

data class SaveDistanceAdmissionPolicyRequest(
    val programId: Long,
    val academicYear: String,
    val versionCode: String,
    val institutionGovernanceType: InstitutionGovernanceType,
    val approvalAuthorityType: ApprovalAuthorityType,
    val institutionName: String,
    val approvingAuthorityName: String,
    val admissionQuota: Int,
    val contractAmount: BigDecimal,
    val higherEducationMinistryAgreementReference: String? = null,
    val economyMinistryAgreementReference: String? = null,
)

data class ApproveDistanceAdmissionPolicyRequest(
    val approvalDocumentNumber: String,
    val approvalDocumentDate: LocalDate,
    val approvalDocumentReference: String,
)

data class DistanceAdmissionPolicyDto(
    val id: Long,
    val programId: Long,
    val programName: String,
    val academicYear: String,
    val versionCode: String,
    val institutionGovernanceType: String,
    val approvalAuthorityType: String,
    val institutionName: String,
    val approvingAuthorityName: String,
    val admissionQuota: Int,
    val contractAmount: BigDecimal,
    val currency: String,
    val higherEducationMinistryAgreementReference: String?,
    val economyMinistryAgreementReference: String?,
    val status: String,
    val createdByName: String,
    val approvalDocumentNumber: String?,
    val approvalDocumentDate: LocalDate?,
    val approvalDocumentReference: String?,
    val approvedByName: String?,
    val approvedAt: Instant?,
    val archivedAt: Instant?,
)
