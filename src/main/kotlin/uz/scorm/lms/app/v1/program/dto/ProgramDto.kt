package uz.scorm.lms.app.v1.program.dto

import java.time.Instant

data class ProgramDto(
    val id: Long? = null,
    val name: String,
    val code: String? = null,
    val degreeLevel: String? = null,
    val active: Boolean = true,
    val distanceEnabled: Boolean = false,
    val informationTechnologyProgram: Boolean = false,
    val educationLanguage: String = "uz",
    val distanceAdmissionLimit: Int? = null,
    val licenseReference: String? = null,
    val fullTimeDurationMonths: Int? = null,
    val distanceDurationMonths: Int? = null,
    val fullTimeAvailable: Boolean? = null,
    val fullTimeBasisReference: String? = null,
    val departmentId: Long? = null,
    val departmentName: String? = null,
    val createdAt: Instant? = null,
    val updatedAt: Instant? = null
)

data class ProgramCreateRequest(
    val name: String,
    val code: String? = null,
    val degreeLevel: String? = null,
    val active: Boolean = true,
    val distanceEnabled: Boolean = false,
    val informationTechnologyProgram: Boolean = false,
    val educationLanguage: String = "uz",
    val distanceAdmissionLimit: Int? = null,
    val licenseReference: String? = null,
    val fullTimeDurationMonths: Int? = null,
    val distanceDurationMonths: Int? = null,
    val fullTimeAvailable: Boolean = false,
    val fullTimeBasisReference: String? = null,
    val departmentId: Long? = null
)

data class ProgramUpdateRequest(
    val name: String? = null,
    val code: String? = null,
    val degreeLevel: String? = null,
    val active: Boolean? = null,
    val distanceEnabled: Boolean? = null,
    val informationTechnologyProgram: Boolean? = null,
    val educationLanguage: String? = null,
    val distanceAdmissionLimit: Int? = null,
    val licenseReference: String? = null,
    val fullTimeDurationMonths: Int? = null,
    val distanceDurationMonths: Int? = null,
    val fullTimeAvailable: Boolean? = null,
    val fullTimeBasisReference: String? = null,
    val departmentId: Long? = null
)
