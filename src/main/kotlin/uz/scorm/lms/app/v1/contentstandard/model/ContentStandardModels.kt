package uz.scorm.lms.app.v1.contentstandard.model

import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.OrderBy
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.courses.model.CourseContentRevision
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant
import java.time.LocalDate

@Entity
@Table(name = "content_standard_checklists")
class ContentStandardChecklist(
    @Column(name = "standard_code", nullable = false, length = 100) var standardCode: String,
    @Column(name = "version_code", nullable = false, length = 100) var versionCode: String,
    @Column(nullable = false, length = 500) var title: String,
    @Column(name = "issuing_authority", nullable = false, length = 500) var issuingAuthority: String,
    @Column(name = "source_document_number", nullable = false, length = 200) var sourceDocumentNumber: String,
    @Column(name = "source_document_date", nullable = false) var sourceDocumentDate: LocalDate,
    @Column(name = "source_reference", nullable = false, length = 1000) var sourceReference: String,
    @Column(name = "valid_from", nullable = false) var validFrom: LocalDate,
    @Column(name = "valid_until") var validUntil: LocalDate? = null,
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) var status: ContentStandardChecklistStatus = ContentStandardChecklistStatus.DRAFT,
    @Column(name = "published_slot") var publishedSlot: Short? = null,
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "created_by_user_id", nullable = false) var createdByUser: User,
    @Column(name = "reviewed_at") var reviewedAt: Instant? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "reviewed_by_user_id") var reviewedByUser: User? = null,
    @Column(name = "review_note", length = 2000) var reviewNote: String? = null,
    @Column(name = "archived_at") var archivedAt: Instant? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "archived_by_user_id") var archivedByUser: User? = null,
) : BaseEntity() {
    @OneToMany(mappedBy = "checklist", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("position ASC")
    val criteria: MutableList<ContentStandardCriterion> = mutableListOf()
}

@Entity
@Table(name = "content_standard_criteria")
class ContentStandardCriterion(
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "checklist_id", nullable = false) var checklist: ContentStandardChecklist,
    @Column(name = "criterion_code", nullable = false, length = 100) var criterionCode: String,
    @Column(nullable = false, length = 500) var title: String,
    @Column(nullable = false, length = 4000) var description: String,
    @Column(nullable = false) var required: Boolean = true,
    @Column(name = "evidence_hint", length = 1000) var evidenceHint: String? = null,
    @Column(nullable = false) var position: Int,
) : BaseEntity()

@Entity
@Table(name = "content_standard_assessments")
class ContentStandardAssessment(
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "content_revision_id", nullable = false) var contentRevision: CourseContentRevision,
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "checklist_id", nullable = false) var checklist: ContentStandardChecklist,
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) var status: ContentStandardAssessmentStatus = ContentStandardAssessmentStatus.DRAFT,
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "created_by_user_id", nullable = false) var createdByUser: User,
    @Column(name = "reviewed_at") var reviewedAt: Instant? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "reviewed_by_user_id") var reviewedByUser: User? = null,
    @Column(name = "review_note", length = 2000) var reviewNote: String? = null,
) : BaseEntity() {
    @OneToMany(mappedBy = "assessment", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("id ASC")
    val responses: MutableList<ContentStandardAssessmentResponse> = mutableListOf()
}

@Entity
@Table(name = "content_standard_assessment_responses")
class ContentStandardAssessmentResponse(
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "assessment_id", nullable = false) var assessment: ContentStandardAssessment,
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "criterion_id", nullable = false) var criterion: ContentStandardCriterion,
    @Column(nullable = false) var met: Boolean,
    @Column(name = "evidence_reference", length = 1000) var evidenceReference: String? = null,
    @Column(length = 2000) var note: String? = null,
) : BaseEntity()

enum class ContentStandardChecklistStatus { DRAFT, PUBLISHED, REJECTED, ARCHIVED }
enum class ContentStandardAssessmentStatus { DRAFT, PASSED, FAILED }
enum class ContentStandardAssessmentDecision { PASSED, FAILED }

