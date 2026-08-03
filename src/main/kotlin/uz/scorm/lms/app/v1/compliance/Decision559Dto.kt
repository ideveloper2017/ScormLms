package uz.scorm.lms.app.v1.compliance

import java.time.Instant

enum class ComplianceStatus { COMPLIANT, WARNING, NON_COMPLIANT }
enum class RequirementImplementation { IMPLEMENTED, PARTIAL, NOT_IMPLEMENTED }

data class Decision559RequirementDto(
    val code: String,
    val clause: String,
    val component: String,
    val requirement: String,
    val implementation: RequirementImplementation,
    val route: String? = null,
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
    val violations: List<ComplianceViolationDto>,
)
