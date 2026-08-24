package uz.scorm.lms.app.v1.subjectcategory.dto

import java.time.Instant

data class SubjectCategoryDto(
    val id: Long,
    val name: String,
    val code: String?,
    val nameEn: String?,
    val nameRu: String?,
    val nameKaa: String?,
    val nameUzCyrillic: String?,
    val active: Boolean,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class SubjectCategoryCreateRequest(
    val name: String,
    val code: String? = null,
    val nameEn: String? = null,
    val nameRu: String? = null,
    val nameKaa: String? = null,
    val nameUzCyrillic: String? = null,
    val active: Boolean = true,
)

data class SubjectCategoryUpdateRequest(
    val name: String? = null,
    val code: String? = null,
    val nameEn: String? = null,
    val nameRu: String? = null,
    val nameKaa: String? = null,
    val nameUzCyrillic: String? = null,
    val clearCode: Boolean = false,
    val clearTranslations: Boolean = false,
    val active: Boolean? = null,
)
