package uz.scorm.lms.app.v1.compliance

import java.time.Instant
import java.time.LocalDate

enum class ComplianceStatus { COMPLIANT, WARNING, NON_COMPLIANT }
enum class RequirementImplementation { IMPLEMENTED, PARTIAL, NOT_IMPLEMENTED }

data class Decision559RequirementDto(
    val code: String,
    val clause: String,
    val component: String,
    val requirement: String,
    val implementation: RequirementImplementation,
    val route: String? = null,
    val evidenceCodes: List<String> = emptyList(),
)

data class ComplianceEvidenceDto(
    val code: String,
    val label: String,
    val recordCount: Long,
    val unit: String,
    val source: String,
    val route: String?,
    val status: ComplianceStatus,
    val measuredAt: Instant = Instant.now(),
)

data class ComplianceMetricDto(
    val code: String,
    val label: String,
    val currentValue: Double,
    val limitValue: Double? = null,
    val unit: String,
    val status: ComplianceStatus,
)

data class ProgramComplianceDto(
    val programId: Long,
    val programName: String,
    val degreeLevel: String?,
    val informationTechnologyProgram: Boolean,
    val localDistanceStudents: Long,
    val admissionLimit: Int?,
    val status: ComplianceStatus,
)

data class ComplianceViolationDto(
    val code: String,
    val clause: String,
    val severity: String,
    val message: String,
    val recommendation: String,
)

data class Decision559ComplianceSummaryDto(
    val decisionNumber: String = Decision559Rules.DECISION_NUMBER,
    val decisionDate: String = Decision559Rules.DECISION_DATE,
    val generatedAt: Instant = Instant.now(),
    val overallStatus: ComplianceStatus,
    val metrics: List<ComplianceMetricDto>,
    val programs: List<ProgramComplianceDto>,
    val requirements: List<Decision559RequirementDto>,
    val evidence: List<ComplianceEvidenceDto>,
    val violations: List<ComplianceViolationDto>,
)

data class CreateComplianceIssueRequest(
    val violationCode: String,
    val ownerId: Long,
    val dueDate: LocalDate,
    val remediationPlan: String,
)

data class UpdateComplianceIssueRequest(
    val ownerId: Long,
    val dueDate: LocalDate,
    val remediationPlan: String,
)

data class ChangeComplianceIssueStatusRequest(
    val status: ComplianceIssueStatus,
    val resolutionEvidence: String? = null,
)

data class ComplianceOwnerDto(val id: Long, val name: String, val username: String)

data class ComplianceIssueDto(
    val id: Long,
    val violationCode: String,
    val clause: String,
    val severity: ComplianceIssueSeverity,
    val title: String,
    val recommendation: String,
    val remediationPlan: String,
    val ownerId: Long,
    val ownerName: String,
    val dueDate: LocalDate,
    val overdue: Boolean,
    val status: ComplianceIssueStatus,
    val resolutionEvidence: String?,
    val resolvedAt: Instant?,
    val resolvedByName: String?,
    val closedAt: Instant?,
    val closedByName: String?,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)
