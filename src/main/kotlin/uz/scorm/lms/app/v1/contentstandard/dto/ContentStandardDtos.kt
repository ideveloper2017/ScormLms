package uz.scorm.lms.app.v1.contentstandard.dto

import uz.scorm.lms.app.v1.contentstandard.model.ContentStandardAssessmentDecision
import uz.scorm.lms.app.v1.contentstandard.model.ContentStandardAssessmentStatus
import uz.scorm.lms.app.v1.contentstandard.model.ContentStandardChecklistStatus
import java.time.Instant
import java.time.LocalDate

data class SaveContentStandardCriterionRequest(
    val criterionCode: String,
    val title: String,
    val description: String,
    val required: Boolean = true,
    val evidenceHint: String? = null,
    val position: Int,
)

data class SaveContentStandardChecklistRequest(
    val standardCode: String,
    val versionCode: String,
    val title: String,
    val issuingAuthority: String,
    val sourceDocumentNumber: String,
    val sourceDocumentDate: LocalDate,
    val sourceReference: String,
    val validFrom: LocalDate,
    val validUntil: LocalDate? = null,
    val criteria: List<SaveContentStandardCriterionRequest>,
)

data class ReviewContentStandardRequest(val note: String)

data class ContentStandardCriterionDto(
    val id: Long,
    val criterionCode: String,
    val title: String,
    val description: String,
    val required: Boolean,
    val evidenceHint: String?,
    val position: Int,
)

data class ContentStandardChecklistDto(
    val id: Long,
    val standardCode: String,
    val versionCode: String,
    val title: String,
    val issuingAuthority: String,
    val sourceDocumentNumber: String,
    val sourceDocumentDate: LocalDate,
    val sourceReference: String,
    val validFrom: LocalDate,
    val validUntil: LocalDate?,
    val status: ContentStandardChecklistStatus,
    val currentlyEffective: Boolean,
    val criteria: List<ContentStandardCriterionDto>,
    val createdByName: String,
    val reviewedAt: Instant?,
    val reviewedByName: String?,
    val reviewNote: String?,
    val archivedAt: Instant?,
)

data class SaveContentStandardAssessmentResponseRequest(
    val criterionId: Long,
    val met: Boolean,
    val evidenceReference: String? = null,
    val note: String? = null,
)

data class SaveContentStandardAssessmentRequest(
    val contentRevisionId: Long,
    val checklistId: Long,
    val responses: List<SaveContentStandardAssessmentResponseRequest>,
)

data class ReviewContentStandardAssessmentRequest(val decision: ContentStandardAssessmentDecision, val note: String)

data class ContentStandardAssessmentResponseDto(
    val criterionId: Long,
    val criterionCode: String,
    val criterionTitle: String,
    val required: Boolean,
    val met: Boolean,
    val evidenceReference: String?,
    val note: String?,
)

data class ContentStandardAssessmentDto(
    val id: Long,
    val checklistId: Long,
    val checklistVersion: String,
    val contentRevisionId: Long,
    val contentId: Long,
    val revisionNumber: Int,
    val contentVersion: String,
    val contentTitle: String,
    val courseTitle: String,
    val status: ContentStandardAssessmentStatus,
    val responses: List<ContentStandardAssessmentResponseDto>,
    val createdByName: String,
    val reviewedAt: Instant?,
    val reviewedByName: String?,
    val reviewNote: String?,
)

data class ContentRevisionAssessmentCandidateDto(
    val contentRevisionId: Long,
    val contentId: Long,
    val revisionNumber: Int,
    val contentVersion: String,
    val contentTitle: String,
    val moduleTitle: String,
    val courseTitle: String,
    val checklistId: Long?,
    val assessmentExists: Boolean,
)

data class ContentStandardCoverage(val checklistEffective: Boolean, val publishedContents: Long, val passedContents: Long) {
    val complete: Boolean = checklistEffective && passedContents == publishedContents
}

