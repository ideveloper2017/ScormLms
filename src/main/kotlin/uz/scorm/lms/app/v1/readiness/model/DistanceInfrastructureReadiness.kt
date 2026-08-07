package uz.scorm.lms.app.v1.readiness.model

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
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

@Entity
@Table(name = "distance_infrastructure_readiness_profiles")
class DistanceInfrastructureReadiness(
    @Column(name = "version_code", nullable = false, unique = true, length = 100) var versionCode: String,
    @Column(nullable = false, length = 500) var title: String,
    @Column(name = "internet_provider", nullable = false, length = 500) var internetProvider: String,
    @Column(name = "internet_capacity_mbps", nullable = false, precision = 12, scale = 2) var internetCapacityMbps: BigDecimal,
    @Column(name = "internet_evidence_reference", nullable = false, length = 1000) var internetEvidenceReference: String,
    @Column(name = "computer_facility_address", nullable = false, length = 1000) var computerFacilityAddress: String,
    @Column(name = "sanitation_document_number", nullable = false, length = 200) var sanitationDocumentNumber: String,
    @Column(name = "sanitation_document_date", nullable = false) var sanitationDocumentDate: LocalDate,
    @Column(name = "sanitation_evidence_reference", nullable = false, length = 1000) var sanitationEvidenceReference: String,
    @Column(name = "technical_staff_count", nullable = false) var technicalStaffCount: Int,
    @Column(name = "technical_staff_qualification_reference", nullable = false, length = 1000) var technicalStaffQualificationReference: String,
    @Column(name = "planned_distance_students", nullable = false) var plannedDistanceStudents: Int,
    @Column(name = "server_capacity_students", nullable = false) var serverCapacityStudents: Int,
    @Enumerated(EnumType.STRING) @Column(name = "server_ownership_type", nullable = false, length = 20) var serverOwnershipType: ServerOwnershipType,
    @Column(name = "server_country_code", nullable = false, length = 2) var serverCountryCode: String,
    @Column(name = "server_location_address", nullable = false, length = 1000) var serverLocationAddress: String,
    @Column(name = "server_document_number", nullable = false, length = 200) var serverDocumentNumber: String,
    @Column(name = "server_document_date", nullable = false) var serverDocumentDate: LocalDate,
    @Column(name = "server_evidence_reference", nullable = false, length = 1000) var serverEvidenceReference: String,
    @Column(name = "lease_start_date") var leaseStartDate: LocalDate? = null,
    @Column(name = "lease_end_date") var leaseEndDate: LocalDate? = null,
    @Column(name = "official_website_url", nullable = false, length = 1000) var officialWebsiteUrl: String,
    @Column(name = "website_has_charter", nullable = false) var websiteHasCharter: Boolean,
    @Column(name = "website_has_curricula", nullable = false) var websiteHasCurricula: Boolean,
    @Column(name = "website_has_staff_information", nullable = false) var websiteHasStaffInformation: Boolean,
    @Column(name = "website_has_academic_calendar", nullable = false) var websiteHasAcademicCalendar: Boolean,
    @Column(name = "website_reviewed_at", nullable = false) var websiteReviewedAt: Instant,
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) var status: DistanceReadinessStatus = DistanceReadinessStatus.DRAFT,
    @Column(name = "verified_slot", unique = true) var verifiedSlot: Short? = null,
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "created_by_user_id", nullable = false) var createdByUser: User,
    @Column(name = "reviewed_at") var reviewedAt: Instant? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "reviewed_by_user_id") var reviewedByUser: User? = null,
    @Column(name = "review_note", length = 2000) var reviewNote: String? = null,
    @Column(name = "archived_at") var archivedAt: Instant? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "archived_by_user_id") var archivedByUser: User? = null,
) : BaseEntity()

enum class ServerOwnershipType { OWNED, LEASED }
enum class DistanceReadinessStatus { DRAFT, VERIFIED, REJECTED, ARCHIVED }

