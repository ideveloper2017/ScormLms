package uz.scorm.lms.app.v1.disclosure.dto

import uz.scorm.lms.app.v1.disclosure.model.OfficialSitePublicationCategory
import uz.scorm.lms.app.v1.disclosure.model.OfficialSitePublicationStatus
import java.time.Instant
import java.time.LocalDate

data class SaveOfficialSitePublicationRequest(
    val category: OfficialSitePublicationCategory,
    val slug: String,
    val versionCode: String,
    val title: String,
    val summary: String,
    val sourceDocumentNumber: String,
    val sourceDocumentDate: LocalDate,
    val sourceReference: String,
    val effectiveFrom: LocalDate,
    val effectiveTo: LocalDate? = null,
)

data class ReviewOfficialSitePublicationRequest(val note: String)

data class OfficialSitePublicationDto(
    val id: Long,
    val category: OfficialSitePublicationCategory,
    val slug: String,
    val versionCode: String,
    val title: String,
    val summary: String,
    val sourceDocumentNumber: String,
    val sourceDocumentDate: LocalDate,
    val sourceReference: String,
    val effectiveFrom: LocalDate,
    val effectiveTo: LocalDate?,
    val status: OfficialSitePublicationStatus,
    val currentlyVisible: Boolean,
    val createdByName: String,
    val reviewedAt: Instant?,
    val reviewedByName: String?,
    val reviewNote: String?,
    val archivedAt: Instant?,
)

data class PublicOfficialSitePublicationDto(
    val category: OfficialSitePublicationCategory,
    val slug: String,
    val versionCode: String,
    val title: String,
    val summary: String,
    val sourceDocumentNumber: String,
    val sourceDocumentDate: LocalDate,
    val sourceReference: String,
    val effectiveFrom: LocalDate,
    val effectiveTo: LocalDate?,
    val publishedAt: Instant,
)

data class PublicInstitutionDisclosureDto(
    val generatedAt: Instant,
    val complete: Boolean,
    val coveredCategories: Set<OfficialSitePublicationCategory>,
    val missingCategories: Set<OfficialSitePublicationCategory>,
    val publications: List<PublicOfficialSitePublicationDto>,
)

