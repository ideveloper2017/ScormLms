package uz.scorm.lms.app.v1.university.dto

import uz.scorm.lms.app.v1.university.model.UniversityLanguage
import java.time.Instant

data class UniversityDto(
    val id: Long,
    val name: String,
    val rector: String,
    val address: String,
    val defaultLanguage: UniversityLanguage,
    val phone: String,
    val bankDetails: String,
    val chiefAccountant: String,
    val legalCounsel: String,
    val active: Boolean,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class CreateUniversityRequest(
    val name: String,
    val rector: String,
    val address: String,
    val defaultLanguage: UniversityLanguage = UniversityLanguage.UZ_LATIN,
    val phone: String,
    val bankDetails: String,
    val chiefAccountant: String,
    val legalCounsel: String,
    val active: Boolean = true,
)

data class UpdateUniversityRequest(
    val name: String? = null,
    val rector: String? = null,
    val address: String? = null,
    val defaultLanguage: UniversityLanguage? = null,
    val phone: String? = null,
    val bankDetails: String? = null,
    val chiefAccountant: String? = null,
    val legalCounsel: String? = null,
    val active: Boolean? = null,
)
