package uz.scorm.lms.app.v1.license.model

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
import java.time.Instant
import java.time.LocalDate

@Entity
@Table(
    name = "non_state_education_licenses",
    indexes = [Index(name = "idx_non_state_license_status_validity", columnList = "status,valid_from,valid_until")],
    uniqueConstraints = [UniqueConstraint(name = "uq_non_state_license_number", columnNames = ["license_number"])],
)
class NonStateEducationLicense(
    @Column(name = "institution_name", nullable = false, length = 500)
    var institutionName: String,

    @Column(name = "license_number", nullable = false, length = 200)
    var licenseNumber: String,

    @Column(name = "issuing_authority", nullable = false, length = 500)
    var issuingAuthority: String,

    @Column(name = "issue_date", nullable = false)
    var issueDate: LocalDate,

    @Column(name = "valid_from", nullable = false)
    var validFrom: LocalDate,

    @Column(name = "valid_until")
    var validUntil: LocalDate? = null,

    @Column(name = "official_registry_reference", nullable = false, length = 1000)
    var officialRegistryReference: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: NonStateLicenseStatus = NonStateLicenseStatus.DRAFT,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    var createdByUser: User,

    @Column(name = "verification_evidence", length = 1000)
    var verificationEvidence: String? = null,

    @Column(name = "verified_at")
    var verifiedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_user_id")
    var verifiedByUser: User? = null,

    @Column(name = "revocation_reason", length = 2000)
    var revocationReason: String? = null,

    @Column(name = "revocation_document_reference", length = 1000)
    var revocationDocumentReference: String? = null,

    @Column(name = "revoked_at")
    var revokedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revoked_by_user_id")
    var revokedByUser: User? = null,
) : BaseEntity()

@Entity
@Table(
    name = "non_state_license_program_scopes",
    indexes = [Index(name = "idx_license_scope_program", columnList = "program_id,license_id")],
    uniqueConstraints = [UniqueConstraint(name = "uq_license_program_scope", columnNames = ["license_id", "program_id"])],
)
class NonStateLicenseProgramScope(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "license_id", nullable = false)
    var license: NonStateEducationLicense,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "program_id", nullable = false)
    var program: Program,

    @Column(name = "program_code_snapshot", nullable = false, length = 100)
    var programCodeSnapshot: String,

    @Column(name = "program_name_snapshot", nullable = false, length = 500)
    var programNameSnapshot: String,

    @Column(name = "degree_level_snapshot", nullable = false, length = 30)
    var degreeLevelSnapshot: String,

    @Column(name = "distance_education_covered", nullable = false)
    var distanceEducationCovered: Boolean = true,
) : BaseEntity()

enum class NonStateLicenseStatus {
    DRAFT,
    VERIFIED,
    REVOKED,
}
