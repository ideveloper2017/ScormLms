package uz.scorm.lms.app.v1.compliance

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
@Table(
    name = "compliance_accountability_referrals",
    uniqueConstraints = [UniqueConstraint(name = "uk_accountability_authority_number", columnNames = ["competent_authority", "referral_number"])],
    indexes = [
        Index(name = "idx_accountability_issue_status", columnList = "compliance_issue_id,status"),
        Index(name = "idx_accountability_referral_date", columnList = "referral_date"),
    ],
)
class ComplianceAccountabilityReferral(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "compliance_issue_id", nullable = false)
    var issue: ComplianceIssue,

    @Column(name = "review_subject_reference", nullable = false, length = 1000)
    var reviewSubjectReference: String,

    @Column(name = "competent_authority", nullable = false, length = 500)
    var competentAuthority: String,

    @Column(name = "legal_basis", nullable = false, length = 1000)
    var legalBasis: String,

    @Column(name = "referral_number", nullable = false, length = 200)
    var referralNumber: String,

    @Column(name = "referral_date", nullable = false)
    var referralDate: LocalDate,

    @Column(name = "evidence_package_reference", nullable = false, length = 1000)
    var evidencePackageReference: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: AccountabilityReferralStatus = AccountabilityReferralStatus.DRAFT,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    var createdByUser: User,

    @Column(name = "referred_at")
    var referredAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referred_by_user_id")
    var referredByUser: User? = null,

    @Column(name = "referral_note", length = 2000)
    var referralNote: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "decision_outcome", length = 40)
    var decisionOutcome: AccountabilityDecisionOutcome? = null,

    @Column(name = "decision_authority", length = 500)
    var decisionAuthority: String? = null,

    @Column(name = "decision_number", length = 200)
    var decisionNumber: String? = null,

    @Column(name = "decision_date")
    var decisionDate: LocalDate? = null,

    @Column(name = "decision_evidence_reference", length = 1000)
    var decisionEvidenceReference: String? = null,

    @Column(name = "decision_summary", length = 4000)
    var decisionSummary: String? = null,

    @Column(name = "decided_at")
    var decidedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by_user_id")
    var decidedByUser: User? = null,
) : BaseEntity()

enum class AccountabilityReferralStatus { DRAFT, REFERRED, DECIDED }

enum class AccountabilityDecisionOutcome {
    RESPONSIBILITY_ESTABLISHED,
    NO_RESPONSIBILITY_FOUND,
    PROCEEDING_TERMINATED,
}
