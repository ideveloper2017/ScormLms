package uz.scorm.lms.app.v1.compliance.uat

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
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant
import java.time.LocalDate

enum class Decision559UatRunStatus { DRAFT, IN_REVIEW, APPROVED, REJECTED }
enum class Decision559UatOutcome { AUTOMATED_PASS, MANUAL_PASS, NOT_APPLICABLE, PARTIAL, BLOCKED_EXTERNAL }
enum class Decision559UatReviewStatus { PENDING, ACCEPTED, REJECTED }
enum class Decision559UatManualEvidenceStatus { PENDING, COLLECTED, ACCEPTED }

@Entity
@Table(
    name = "decision_559_uat_runs",
    indexes = [Index(name = "idx_559_uat_run_status", columnList = "status,created_at")],
)
class Decision559UatRun(
    @Column(nullable = false, length = 255)
    var title: String,

    @Column(name = "source_sha256", nullable = false, length = 64)
    var sourceSha256: String,

    @Column(name = "manifest_schema_version", nullable = false)
    var manifestSchemaVersion: Int = 5,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: Decision559UatRunStatus = Decision559UatRunStatus.DRAFT,

    @Column(name = "protocol_number", length = 100)
    var protocolNumber: String? = null,

    @Column(name = "protocol_signed_date")
    var protocolSignedDate: LocalDate? = null,

    @Column(name = "protocol_signatories", length = 2000)
    var protocolSignatories: String? = null,

    @Column(name = "protocol_storage_name", length = 255)
    var protocolStorageName: String? = null,

    @Column(name = "protocol_original_name", length = 255)
    var protocolOriginalName: String? = null,

    @Column(name = "protocol_content_type", length = 100)
    var protocolContentType: String? = null,

    @Column(name = "protocol_size_bytes")
    var protocolSizeBytes: Long? = null,

    @Column(name = "protocol_sha256", length = 64)
    var protocolSha256: String? = null,

    @Column(name = "protocol_evidence_set_sha256", length = 64)
    var protocolEvidenceSetSha256: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "protocol_uploaded_by")
    var protocolUploadedBy: User? = null,

    @Column(name = "protocol_uploaded_at")
    var protocolUploadedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by")
    var submittedBy: User? = null,

    @Column(name = "submitted_at")
    var submittedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    var approvedBy: User? = null,

    @Column(name = "approved_at")
    var approvedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejected_by")
    var rejectedBy: User? = null,

    @Column(name = "rejected_at")
    var rejectedAt: Instant? = null,

    @Column(name = "rejection_reason", length = 2000)
    var rejectionReason: String? = null,
) : BaseEntity()

@Entity
@Table(
    name = "decision_559_uat_manual_task_coordination",
    uniqueConstraints = [UniqueConstraint(
        name = "uq_559_uat_manual_task_coord",
        columnNames = ["run_id", "requirement_id", "item_index"],
    )],
    indexes = [Index(name = "idx_559_uat_manual_task_run", columnList = "run_id,band,item_index")],
)
class Decision559UatManualTaskCoordination(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id", nullable = false)
    var run: Decision559UatRun,

    @Column(name = "requirement_id", nullable = false, length = 32)
    var requirementId: String,

    @Column(nullable = false)
    var band: Int,

    @Column(name = "item_index", nullable = false)
    var itemIndex: Int,

    @Column(name = "assignee_name", nullable = false, length = 255)
    var assigneeName: String,

    @Column(name = "due_date", nullable = false)
    var dueDate: LocalDate,

    @Column(nullable = false, length = 2000)
    var note: String,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "coordinated_by", nullable = false)
    var coordinatedBy: User,
) : BaseEntity()

@Entity
@Table(
    name = "decision_559_uat_evidence_files",
    indexes = [Index(name = "idx_559_uat_file_evidence", columnList = "evidence_id,id")],
)
class Decision559UatEvidenceFile(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evidence_id", nullable = false)
    var evidence: Decision559UatEvidence,

    @Column(name = "storage_name", nullable = false, length = 255)
    var storageName: String,

    @Column(name = "original_name", nullable = false, length = 255)
    var originalName: String,

    @Column(name = "content_type", nullable = false, length = 100)
    var contentType: String,

    @Column(name = "size_bytes", nullable = false)
    var sizeBytes: Long,

    @Column(nullable = false, length = 64)
    var sha256: String,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by", nullable = false)
    var uploadedBy: User,

    @Column(name = "uploaded_at", nullable = false)
    var uploadedAt: Instant = Instant.now(),
) : BaseEntity()

@Entity
@Table(
    name = "decision_559_uat_evidence",
    uniqueConstraints = [UniqueConstraint(name = "uk_559_uat_evidence_band", columnNames = ["run_id", "band"])],
    indexes = [
        Index(name = "idx_559_uat_evidence_run", columnList = "run_id,band"),
        Index(name = "idx_559_uat_evidence_review", columnList = "run_id,review_status,outcome"),
    ],
)
class Decision559UatEvidence(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id", nullable = false)
    var run: Decision559UatRun,

    @Column(name = "requirement_id", nullable = false, length = 30)
    var requirementId: String,

    @Column(nullable = false)
    var band: Int,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    var outcome: Decision559UatOutcome,

    @Column(name = "owner_name", nullable = false, length = 255)
    var ownerName: String,

    @Column(nullable = false, length = 4000)
    var summary: String,

    @Column(name = "evidence_reference", length = 1000)
    var evidenceReference: String? = null,

    @Column(name = "manual_evidence_coverage", nullable = false, length = 4000)
    var manualEvidenceCoverage: String = "",

    @Column(name = "storage_name", length = 255)
    var storageName: String? = null,

    @Column(name = "original_name", length = 255)
    var originalName: String? = null,

    @Column(name = "content_type", length = 100)
    var contentType: String? = null,

    @Column(name = "size_bytes")
    var sizeBytes: Long? = null,

    @Column(length = 64)
    var sha256: String? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submitted_by", nullable = false)
    var submittedBy: User,

    @Column(name = "submitted_at", nullable = false)
    var submittedAt: Instant = Instant.now(),

    @Enumerated(EnumType.STRING)
    @Column(name = "review_status", nullable = false, length = 20)
    var reviewStatus: Decision559UatReviewStatus = Decision559UatReviewStatus.PENDING,

    @Column(name = "review_notes", length = 2000)
    var reviewNotes: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    var reviewedBy: User? = null,

    @Column(name = "reviewed_at")
    var reviewedAt: Instant? = null,
) : BaseEntity()
