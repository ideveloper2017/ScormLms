package uz.scorm.lms.app.v1.readiness.dto

import uz.scorm.lms.app.v1.readiness.model.DistanceReadinessStatus
import uz.scorm.lms.app.v1.readiness.model.ServerOwnershipType
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

data class SaveDistanceInfrastructureReadinessRequest(
    val versionCode: String,
    val title: String,
    val internetProvider: String,
    val internetCapacityMbps: BigDecimal,
    val internetEvidenceReference: String,
    val computerFacilityAddress: String,
    val sanitationDocumentNumber: String,
    val sanitationDocumentDate: LocalDate,
    val sanitationEvidenceReference: String,
    val technicalStaffCount: Int,
    val technicalStaffQualificationReference: String,
    val plannedDistanceStudents: Int,
    val serverCapacityStudents: Int,
    val serverOwnershipType: ServerOwnershipType,
    val serverCountryCode: String,
    val serverLocationAddress: String,
    val serverDocumentNumber: String,
    val serverDocumentDate: LocalDate,
    val serverEvidenceReference: String,
    val leaseStartDate: LocalDate? = null,
    val leaseEndDate: LocalDate? = null,
    val officialWebsiteUrl: String,
    val websiteHasCharter: Boolean,
    val websiteHasCurricula: Boolean,
    val websiteHasStaffInformation: Boolean,
    val websiteHasAcademicCalendar: Boolean,
    val websiteReviewedAt: Instant,
)

data class ReviewDistanceInfrastructureReadinessRequest(val note: String)

data class DistanceInfrastructureReadinessDto(
    val id: Long,
    val versionCode: String,
    val title: String,
    val internetProvider: String,
    val internetCapacityMbps: BigDecimal,
    val internetEvidenceReference: String,
    val computerFacilityAddress: String,
    val sanitationDocumentNumber: String,
    val sanitationDocumentDate: LocalDate,
    val sanitationEvidenceReference: String,
    val technicalStaffCount: Int,
    val technicalStaffQualificationReference: String,
    val plannedDistanceStudents: Int,
    val serverCapacityStudents: Int,
    val serverOwnershipType: ServerOwnershipType,
    val serverCountryCode: String,
    val serverLocationAddress: String,
    val serverDocumentNumber: String,
    val serverDocumentDate: LocalDate,
    val serverEvidenceReference: String,
    val leaseStartDate: LocalDate?,
    val leaseEndDate: LocalDate?,
    val minimumFiveYearLease: Boolean,
    val officialWebsiteUrl: String,
    val websiteHasCharter: Boolean,
    val websiteHasCurricula: Boolean,
    val websiteHasStaffInformation: Boolean,
    val websiteHasAcademicCalendar: Boolean,
    val websiteReviewedAt: Instant,
    val status: DistanceReadinessStatus,
    val createdByName: String,
    val reviewedAt: Instant?,
    val reviewedByName: String?,
    val reviewNote: String?,
    val archivedAt: Instant?,
)

