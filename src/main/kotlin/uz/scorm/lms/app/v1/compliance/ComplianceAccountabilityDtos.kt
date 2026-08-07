package uz.scorm.lms.app.v1.compliance

import java.time.Instant
import java.time.LocalDate

data class SaveAccountabilityReferralRequest(
    val complianceIssueId: Long,
    val reviewSubjectReference: String,
    val competentAuthority: String,
    val legalBasis: String,
    val referralNumber: String,
    val referralDate: LocalDate,
    val evidencePackageReference: String,
)

data class ReferAccountabilityRequest(val referralNote: String)

data class RecordAccountabilityDecisionRequest(
    val outcome: AccountabilityDecisionOutcome,
    val decisionAuthority: String,
    val decisionNumber: String,
    val decisionDate: LocalDate,
    val decisionEvidenceReference: String,
    val decisionSummary: String,
)

data class AccountabilityReferralDto(
    val id: Long,
    val complianceIssueId: Long,
    val issueTitle: String,
    val issueClause: String,
    val reviewSubjectReference: String,
    val competentAuthority: String,
    val legalBasis: String,
    val referralNumber: String,
    val referralDate: LocalDate,
    val evidencePackageReference: String,
    val status: AccountabilityReferralStatus,
    val createdByName: String,
    val referredAt: Instant?,
    val referredByName: String?,
    val referralNote: String?,
    val decisionOutcome: AccountabilityDecisionOutcome?,
    val responsibilityEstablished: Boolean,
    val decisionAuthority: String?,
    val decisionNumber: String?,
    val decisionDate: LocalDate?,
    val decisionEvidenceReference: String?,
    val decisionSummary: String?,
    val decidedAt: Instant?,
    val decidedByName: String?,
)
