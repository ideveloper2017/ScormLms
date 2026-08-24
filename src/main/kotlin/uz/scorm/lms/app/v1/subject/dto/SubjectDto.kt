package uz.scorm.lms.app.v1.subject.dto

import java.time.Instant
import uz.scorm.lms.app.v1.subject.model.SubjectType

data class SubjectDto(
    val id: Long? = null,
    val name: String,
    val nameEn: String? = null,
    val nameRu: String? = null,
    val nameKaa: String? = null,
    val nameUzCyrillic: String? = null,
    val code: String? = null,
    val credits: Int? = null,
    val subjectType: SubjectType? = null,
    val active: Boolean = true,
    val programId: Long? = null,
    val programName: String? = null,
    val subjectCategoryId: Long? = null,
    val subjectCategoryName: String? = null,
    val createdAt: Instant? = null,
    val updatedAt: Instant? = null
)

data class SubjectCreateRequest(
    val name: String,
    val nameEn: String? = null,
    val nameRu: String? = null,
    val nameKaa: String? = null,
    val nameUzCyrillic: String? = null,
    val code: String? = null,
    val credits: Int? = null,
    val subjectType: SubjectType? = null,
    val active: Boolean = true,
    val programId: Long? = null,
    val subjectCategoryId: Long? = null,
)

data class SubjectUpdateRequest(
    val name: String? = null,
    val nameEn: String? = null,
    val nameRu: String? = null,
    val nameKaa: String? = null,
    val nameUzCyrillic: String? = null,
    val code: String? = null,
    val credits: Int? = null,
    val subjectType: SubjectType? = null,
    val active: Boolean? = null,
    val programId: Long? = null,
    val subjectCategoryId: Long? = null,
    val clearSubjectCategory: Boolean = false,
    val clearOptionalFields: Boolean = false,
)
