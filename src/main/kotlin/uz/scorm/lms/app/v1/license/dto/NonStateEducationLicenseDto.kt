package uz.scorm.lms.app.v1.license.dto

import java.time.Instant
import java.time.LocalDate

data class SaveNonStateEducationLicenseRequest(
    val institutionName: String,
    val licenseNumber: String,
    val issuingAuthority: String,
    val issueDate: LocalDate,
    val validFrom: LocalDate,
    val validUntil: LocalDate? = null,
    val officialRegistryReference: String,
)

data class AddLicenseProgramScopeRequest(val programId: Long)
data class VerifyNonStateEducationLicenseRequest(val verificationEvidence: String)
data class RevokeNonStateEducationLicenseRequest(val reason: String, val documentReference: String)

data class LicenseProgramScopeDto(
    val id: Long,
    val programId: Long,
    val programCode: String,
    val programName: String,
    val degreeLevel: String,
    val distanceEducationCovered: Boolean,
)

data class NonStateEducationLicenseDto(
    val id: Long,
    val institutionName: String,
    val licenseNumber: String,
    val issuingAuthority: String,
    val issueDate: LocalDate,
    val validFrom: LocalDate,
    val validUntil: LocalDate?,
    val officialRegistryReference: String,
    val status: String,
    val effective: Boolean,
    val createdByName: String,
    val verificationEvidence: String?,
    val verifiedByName: String?,
    val verifiedAt: Instant?,
    val revocationReason: String?,
    val revocationDocumentReference: String?,
    val revokedAt: Instant?,
    val scopes: List<LicenseProgramScopeDto>,
)
