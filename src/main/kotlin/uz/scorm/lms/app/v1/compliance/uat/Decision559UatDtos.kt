package uz.scorm.lms.app.v1.compliance.uat

import java.time.Instant
import java.time.LocalDate

data class CreateDecision559UatRunRequest(
    val title: String,
    val sourceSha256: String,
)

data class ReviewDecision559UatEvidenceRequest(
    val status: Decision559UatReviewStatus,
    val notes: String,
)

data class RejectDecision559UatRunRequest(val reason: String)

data class UpdateDecision559UatManualTaskCoordinationRequest(
    val assigneeName: String,
    val dueDate: LocalDate,
    val note: String,
)

data class BulkCoordinateDecision559UatManualTasksRequest(
    val dueDate: LocalDate,
    val note: String,
)

data class Decision559UatRequirementGuidanceDto(
    val id: String,
    val band: Int,
    val title: String,
    val baselineStatus: String,
    val owner: String,
    val evidence: List<String>,
    val blockedBy: List<String>,
    val manualEvidence: List<String>,
    val note: String,
)

data class Decision559UatRunDto(
    val id: Long,
    val title: String,
    val sourceSha256: String,
    val manifestSchemaVersion: Int,
    val status: Decision559UatRunStatus,
    val evidenceCount: Int,
    val acceptedCount: Int,
    val blockingCount: Int,
    val manualEvidenceRequiredCount: Int,
    val manualEvidenceCoveredCount: Int,
    val manualEvidenceAcceptedCount: Int,
    val protocolNumber: String?,
    val protocolSignedDate: LocalDate?,
    val protocolSignatories: String?,
    val protocolOriginalName: String?,
    val protocolSha256: String?,
    val protocolEvidenceSetSha256: String?,
    val protocolUploadedAt: Instant?,
    val evidenceSetSha256: String,
    val readyToSubmit: Boolean,
    val submittedByName: String?,
    val submittedAt: Instant?,
    val approvedByName: String?,
    val approvedAt: Instant?,
    val rejectionReason: String?,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class Decision559UatEvidenceDto(
    val id: Long,
    val runId: Long,
    val requirementId: String,
    val band: Int,
    val outcome: Decision559UatOutcome,
    val ownerName: String,
    val summary: String,
    val evidenceReference: String?,
    val manualEvidenceCoverage: List<String>,
    val originalName: String?,
    val contentType: String?,
    val sizeBytes: Long?,
    val sha256: String?,
    val files: List<Decision559UatEvidenceFileDto>,
    val submittedByName: String,
    val submittedAt: Instant,
    val reviewStatus: Decision559UatReviewStatus,
    val reviewNotes: String?,
    val reviewedByName: String?,
    val reviewedAt: Instant?,
)

data class Decision559UatEvidenceFileDto(
    val id: Long,
    val originalName: String,
    val contentType: String,
    val sizeBytes: Long,
    val sha256: String,
    val uploadedByName: String,
    val uploadedAt: Instant,
)

data class Decision559UatRunDetailDto(
    val run: Decision559UatRunDto,
    val evidence: List<Decision559UatEvidenceDto>,
)

data class Decision559UatManualEvidenceProgressDto(
    val runId: Long,
    val requiredCount: Int,
    val pendingCount: Int,
    val collectedCount: Int,
    val acceptedCount: Int,
    val coordinatedCount: Int,
    val uncoordinatedCount: Int,
    val overdueCount: Int,
    val items: List<Decision559UatManualEvidenceProgressItemDto>,
)

data class Decision559UatManualEvidenceProgressItemDto(
    val requirementId: String,
    val band: Int,
    val itemIndex: Int,
    val description: String,
    val recommendedOwner: String,
    val actualOwnerName: String?,
    val blockedBy: List<String>,
    val status: Decision559UatManualEvidenceStatus,
    val outcome: Decision559UatOutcome?,
    val reviewStatus: Decision559UatReviewStatus?,
    val evidenceId: Long?,
    val fileCount: Int,
    val submittedAt: Instant?,
    val reviewedByName: String?,
    val reviewedAt: Instant?,
    val coordinationAssigneeName: String?,
    val coordinationDueDate: LocalDate?,
    val coordinationNote: String?,
    val coordinationOverdue: Boolean,
    val coordinatedByName: String?,
    val coordinationUpdatedAt: Instant?,
)

data class PrivateEvidenceFile(
    val bytes: ByteArray,
    val contentType: String,
    val originalName: String,
    val sha256: String,
)

data class Decision559UatManifestDto(
    val schemaVersion: Int,
    val decisionNumber: Int = 559,
    val runId: Long,
    val title: String,
    val snapshotAt: Instant?,
    val source: Decision559UatManifestSourceDto,
    val status: Decision559UatRunStatus,
    val evidenceSetSha256: String,
    val readyToSubmit: Boolean,
    val manualEvidenceRequiredCount: Int,
    val manualEvidenceCoveredCount: Int,
    val manualEvidenceAcceptedCount: Int,
    val protocol: Decision559UatManifestProtocolDto,
    val requirements: List<Decision559UatManifestRequirementDto>,
    val submittedByName: String?,
    val submittedAt: Instant?,
    val approvedByName: String?,
    val approvedAt: Instant?,
)

data class Decision559UatManifestSourceDto(
    val fileName: String = "559-son qaror.pdf",
    val pageCount: Int = 10,
    val sha256: String,
)

data class Decision559UatManifestProtocolDto(
    val signed: Boolean,
    val number: String?,
    val signedDate: LocalDate?,
    val signatories: List<String>,
    val originalName: String?,
    val contentType: String?,
    val sizeBytes: Long?,
    val sha256: String?,
    val evidenceSetSha256: String?,
    val uploadedByName: String?,
    val uploadedAt: Instant?,
)

data class Decision559UatManifestRequirementDto(
    val id: String,
    val band: Int,
    val outcome: Decision559UatOutcome,
    val owner: String,
    val summary: String,
    val evidenceReference: String?,
    val manualEvidenceCoverage: List<String>,
    val file: Decision559UatManifestFileDto?,
    val files: List<Decision559UatManifestFileDto>,
    val submittedById: Long,
    val submittedByName: String,
    val submittedAt: Instant,
    val reviewStatus: Decision559UatReviewStatus,
    val reviewNotes: String?,
    val reviewedById: Long?,
    val reviewedByName: String?,
    val reviewedAt: Instant?,
)

data class Decision559UatManifestFileDto(
    val id: Long?,
    val bundlePath: String?,
    val originalName: String,
    val contentType: String,
    val sizeBytes: Long,
    val sha256: String,
    val uploadedById: Long?,
    val uploadedByName: String?,
    val uploadedAt: Instant?,
)
