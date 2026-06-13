package uz.scorm.lms.app.v1.program.dto

import java.time.Instant

data class ProgramDto(
    val id: Long? = null,
    val name: String,
    val code: String? = null,
    val degreeLevel: String? = null,
    val active: Boolean = true,
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
    val departmentId: Long? = null
)

data class ProgramUpdateRequest(
    val name: String? = null,
    val code: String? = null,
    val degreeLevel: String? = null,
    val active: Boolean? = null,
    val departmentId: Long? = null
)
