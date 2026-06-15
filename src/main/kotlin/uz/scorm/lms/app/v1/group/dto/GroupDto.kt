package uz.scorm.lms.app.v1.group.dto

import java.time.Instant

data class GroupDto(
    val id: Long? = null,
    val name: String,
    val educationYear: String? = null,
    val language: String? = null,
    val active: Boolean = true,
    val programId: Long? = null,
    val programName: String? = null,
    val createdAt: Instant? = null,
    val updatedAt: Instant? = null
)

data class GroupCreateRequest(
    val name: String,
    val educationYear: String? = null,
    val language: String? = null,
    val active: Boolean = true,
    val programId: Long? = null
)

data class GroupUpdateRequest(
    val name: String? = null,
    val educationYear: String? = null,
    val language: String? = null,
    val active: Boolean? = null,
    val programId: Long? = null
)
