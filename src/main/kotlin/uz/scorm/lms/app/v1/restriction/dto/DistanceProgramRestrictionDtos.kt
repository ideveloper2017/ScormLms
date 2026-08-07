package uz.scorm.lms.app.v1.restriction.dto

import uz.scorm.lms.app.v1.restriction.model.DistanceRestrictionCatalogStatus
import uz.scorm.lms.app.v1.restriction.model.DistanceRestrictionDegreeLevel
import java.time.Instant
import java.time.LocalDate

data class DistanceProgramRestrictionEntryRequest(
    val programCode: String,
    val programName: String,
    val degreeLevel: DistanceRestrictionDegreeLevel,
    val reason: String,
)

data class SaveDistanceProgramRestrictionCatalogRequest(
    val catalogYear: Int,
    val versionCode: String,
    val authorityName: String,
    val documentNumber: String,
    val documentDate: LocalDate,
    val publicationDate: LocalDate,
    val documentReference: String,
    val scopeNote: String,
    val entries: List<DistanceProgramRestrictionEntryRequest>,
)

data class PublishDistanceProgramRestrictionCatalogRequest(val verificationNote: String)

data class DistanceProgramRestrictionEntryDto(
    val id: Long,
    val programCode: String,
    val programName: String,
    val degreeLevel: DistanceRestrictionDegreeLevel,
    val reason: String,
)

data class DistanceProgramRestrictionCatalogDto(
    val id: Long,
    val catalogYear: Int,
    val versionCode: String,
    val authorityName: String,
    val documentNumber: String,
    val documentDate: LocalDate,
    val publicationDate: LocalDate,
    val publicationDeadline: LocalDate,
    val deadlineCompliant: Boolean,
    val documentReference: String,
    val scopeNote: String,
    val status: DistanceRestrictionCatalogStatus,
    val entries: List<DistanceProgramRestrictionEntryDto>,
    val createdByName: String,
    val publishedAt: Instant?,
    val publishedByName: String?,
    val verificationNote: String?,
    val archivedAt: Instant?,
)
