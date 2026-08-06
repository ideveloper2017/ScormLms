package uz.scorm.lms.app.v1.compliance

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant
import java.time.LocalDate

enum class ComplianceIssueStatus { OPEN, IN_PROGRESS, RESOLVED, CLOSED }
enum class ComplianceIssueSeverity { CRITICAL, WARNING }

@Entity
@Table(name = "compliance_issues")
class ComplianceIssue(
    @Column(name = "violation_code", nullable = false, length = 160)
    var violationCode: String = "",

    @Column(nullable = false, length = 100)
    var clause: String = "",

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var severity: ComplianceIssueSeverity = ComplianceIssueSeverity.WARNING,

    @Column(nullable = false, length = 1000)
    var title: String = "",

    @Column(nullable = false, length = 2000)
    var recommendation: String = "",

    @Column(name = "remediation_plan", nullable = false, length = 4000)
    var remediationPlan: String = "",

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    var owner: User? = null,

    @Column(name = "due_date", nullable = false)
    var dueDate: LocalDate = LocalDate.now(),

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    var status: ComplianceIssueStatus = ComplianceIssueStatus.OPEN,

    @Column(name = "resolution_evidence", length = 4000)
    var resolutionEvidence: String? = null,

    @Column(name = "resolved_at")
    var resolvedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    var resolvedBy: User? = null,

    @Column(name = "closed_at")
    var closedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "closed_by")
    var closedBy: User? = null,
) : BaseEntity()
