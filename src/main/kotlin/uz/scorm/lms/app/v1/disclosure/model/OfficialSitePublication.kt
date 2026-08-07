package uz.scorm.lms.app.v1.disclosure.model

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

@Entity
@Table(name = "official_site_publications")
class OfficialSitePublication(
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    var category: OfficialSitePublicationCategory,
    @Column(nullable = false, length = 100) var slug: String,
    @Column(name = "version_code", nullable = false, length = 100) var versionCode: String,
    @Column(nullable = false, length = 500) var title: String,
    @Column(nullable = false, length = 10_000) var summary: String,
    @Column(name = "source_document_number", nullable = false, length = 200) var sourceDocumentNumber: String,
    @Column(name = "source_document_date", nullable = false) var sourceDocumentDate: LocalDate,
    @Column(name = "source_reference", nullable = false, length = 1000) var sourceReference: String,
    @Column(name = "effective_from", nullable = false) var effectiveFrom: LocalDate,
    @Column(name = "effective_to") var effectiveTo: LocalDate? = null,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: OfficialSitePublicationStatus = OfficialSitePublicationStatus.DRAFT,
    @Column(name = "published_slot") var publishedSlot: Short? = null,
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    var createdByUser: User,
    @Column(name = "reviewed_at") var reviewedAt: Instant? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_user_id")
    var reviewedByUser: User? = null,
    @Column(name = "review_note", length = 2000) var reviewNote: String? = null,
    @Column(name = "archived_at") var archivedAt: Instant? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "archived_by_user_id")
    var archivedByUser: User? = null,
) : BaseEntity()

enum class OfficialSitePublicationCategory {
    CHARTER_OR_STATUTE,
    CURRICULA_AND_PROGRAMS,
    TEACHING_STAFF,
    ACADEMIC_CALENDAR,
}

enum class OfficialSitePublicationStatus { DRAFT, PUBLISHED, REJECTED, ARCHIVED }

