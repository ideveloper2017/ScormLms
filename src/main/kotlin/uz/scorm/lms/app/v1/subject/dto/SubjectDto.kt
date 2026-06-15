package uz.scorm.lms.app.v1.subject.dto

import java.time.Instant

data class SubjectDto(
    val id: Long? = null,
    val name: String,
    val code: String? = null,
    val credits: Int? = null,
    val active: Boolean = true,
    val programId: Long? = null,
    val programName: String? = null,
    val createdAt: Instant? = null,
    val updatedAt: Instant? = null
)

data class SubjectCreateRequest(
    val name: String,
    val code: String? = null,
    val credits: Int? = null,
    val active: Boolean = true,
    val programId: Long? = null
)

data class SubjectUpdateRequest(
    val name: String? = null,
    val code: String? = null,
    val credits: Int? = null,
    val active: Boolean? = null,
    val programId: Long? = null
)
