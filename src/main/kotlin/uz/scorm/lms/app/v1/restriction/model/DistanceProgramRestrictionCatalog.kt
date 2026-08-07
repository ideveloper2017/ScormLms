package uz.scorm.lms.app.v1.restriction.model

import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant
import java.time.LocalDate

@Entity
@Table(
    name = "distance_program_restriction_catalogs",
    uniqueConstraints = [UniqueConstraint(name = "uq_distance_restriction_year_version", columnNames = ["catalog_year", "version_code"])],
    indexes = [Index(name = "idx_distance_restriction_year_status", columnList = "catalog_year,status")],
)
class DistanceProgramRestrictionCatalog(
    @Column(name = "catalog_year", nullable = false)
    var catalogYear: Int,

    @Column(name = "version_code", nullable = false, length = 100)
    var versionCode: String,

    @Column(name = "authority_name", nullable = false, length = 500)
    var authorityName: String,

    @Column(name = "document_number", nullable = false, length = 200)
    var documentNumber: String,

    @Column(name = "document_date", nullable = false)
    var documentDate: LocalDate,

    @Column(name = "publication_date", nullable = false)
    var publicationDate: LocalDate,

    @Column(name = "document_reference", nullable = false, length = 1000)
    var documentReference: String,

    @Column(name = "scope_note", nullable = false, length = 2000)
    var scopeNote: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: DistanceRestrictionCatalogStatus = DistanceRestrictionCatalogStatus.DRAFT,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    var createdByUser: User,

    @Column(name = "published_at")
    var publishedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "published_by_user_id")
    var publishedByUser: User? = null,

    @Column(name = "verification_note", length = 2000)
    var verificationNote: String? = null,

    @Column(name = "archived_at")
    var archivedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "archived_by_user_id")
    var archivedByUser: User? = null,
) : BaseEntity() {
    @OneToMany(mappedBy = "catalog", cascade = [CascadeType.ALL], orphanRemoval = true)
    val entries: MutableList<DistanceProgramRestrictionEntry> = mutableListOf()
}

@Entity
@Table(
    name = "distance_program_restriction_entries",
    uniqueConstraints = [UniqueConstraint(name = "uq_distance_restriction_entry", columnNames = ["catalog_id", "program_code", "degree_level"])],
    indexes = [Index(name = "idx_distance_restriction_entry_lookup", columnList = "program_code,degree_level")],
)
class DistanceProgramRestrictionEntry(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "catalog_id", nullable = false)
    var catalog: DistanceProgramRestrictionCatalog,

    @Column(name = "program_code", nullable = false, length = 100)
    var programCode: String,

    @Column(name = "program_name", nullable = false, length = 500)
    var programName: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "degree_level", nullable = false, length = 20)
    var degreeLevel: DistanceRestrictionDegreeLevel,

    @Column(nullable = false, length = 1000)
    var reason: String,
) : BaseEntity()

enum class DistanceRestrictionCatalogStatus { DRAFT, PUBLISHED, ARCHIVED }
enum class DistanceRestrictionDegreeLevel { BACHELOR, MASTER }
