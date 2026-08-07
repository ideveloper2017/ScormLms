package uz.scorm.lms.app.v1.biometric.model

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

@Entity
@Table(name = "biometric_policies", uniqueConstraints = [UniqueConstraint(name = "uq_biometric_policy_version", columnNames = ["version_code"])])
class BiometricPolicy(
    @Column(name = "version_code", nullable = false, length = 100) var versionCode: String,
    @Column(nullable = false, length = 500) var title: String,
    @Column(name = "purpose_text", nullable = false, length = 2000) var purposeText: String,
    @Column(name = "legal_basis", nullable = false, length = 2000) var legalBasis: String,
    @Column(name = "consent_text", nullable = false, columnDefinition = "TEXT") var consentText: String,
    @Column(name = "privacy_notice", nullable = false, columnDefinition = "TEXT") var privacyNotice: String,
    @Column(name = "document_number", nullable = false, length = 200) var documentNumber: String,
    @Column(name = "document_date", nullable = false) var documentDate: LocalDate,
    @Column(name = "document_reference", nullable = false, length = 1000) var documentReference: String,
    @Column(name = "face_template_retention_days", nullable = false) var faceTemplateRetentionDays: Int,
    @Column(name = "proctoring_evidence_retention_days", nullable = false) var proctoringEvidenceRetentionDays: Int,
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) var status: BiometricPolicyStatus = BiometricPolicyStatus.DRAFT,
    @Column(name = "published_slot", unique = true) var publishedSlot: Short? = null,
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "created_by_user_id", nullable = false) var createdByUser: User,
    @Column(name = "published_at") var publishedAt: Instant? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "published_by_user_id") var publishedByUser: User? = null,
    @Column(name = "approval_note", length = 2000) var approvalNote: String? = null,
    @Column(name = "archived_at") var archivedAt: Instant? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "archived_by_user_id") var archivedByUser: User? = null,
) : BaseEntity()

@Entity
@Table(name = "biometric_consent_events", indexes = [Index(name = "idx_biometric_consent_latest", columnList = "user_id,policy_id,occurred_at,id")])
class BiometricConsentEvent(
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) var user: User,
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "policy_id", nullable = false) var policy: BiometricPolicy,
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) var action: BiometricConsentAction,
    @Column(name = "statement_hash", nullable = false, length = 64) var statementHash: String,
    @Column(name = "occurred_at", nullable = false) var occurredAt: Instant,
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "actor_user_id", nullable = false) var actorUser: User,
    @Column(length = 1000) var reason: String? = null,
) : BaseEntity()

@Entity
@Table(name = "biometric_purge_records", indexes = [Index(name = "idx_biometric_purge_user_time", columnList = "user_id,executed_at")])
class BiometricPurgeRecord(
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) var user: User,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "policy_id") var policy: BiometricPolicy? = null,
    @Enumerated(EnumType.STRING) @Column(name = "asset_type", nullable = false, length = 30) var assetType: BiometricAssetType,
    @Column(nullable = false, length = 1000) var reason: String,
    @Column(name = "due_at") var dueAt: Instant? = null,
    @Column(name = "executed_at", nullable = false) var executedAt: Instant,
    @Column(name = "file_deleted") var fileDeleted: Boolean? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "executed_by_user_id") var executedByUser: User? = null,
) : BaseEntity()

enum class BiometricPolicyStatus { DRAFT, PUBLISHED, ARCHIVED }
enum class BiometricConsentAction { GRANTED, WITHDRAWN }
enum class BiometricAssetType { FACE_TEMPLATE, PROCTORING_EVIDENCE }
