package uz.scorm.lms.app.v1.faculty.dto

import java.time.Instant

data class FacultyDto(
    val id: Long? = null,
    val name: String,
    val code: String? = null,
    val active: Boolean = true,
    val createdAt: Instant? = null,
    val updatedAt: Instant? = null
)

data class FacultyCreateRequest(
    val name: String,
    val code: String? = null,
    val active: Boolean = true
)

data class FacultyUpdateRequest(
    val name: String? = null,
    val code: String? = null,
    val active: Boolean? = null
)
