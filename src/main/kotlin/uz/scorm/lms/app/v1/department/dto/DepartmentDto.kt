package uz.scorm.lms.app.v1.department.dto

import java.time.Instant

data class DepartmentDto(
    val id: Long? = null,
    val name: String,
    val code: String? = null,
    val active: Boolean = true,
    val facultyId: Long? = null,
    val facultyName: String? = null,
    val createdAt: Instant? = null,
    val updatedAt: Instant? = null
)

data class DepartmentCreateRequest(
    val name: String,
    val code: String? = null,
    val active: Boolean = true,
    val facultyId: Long? = null
)

data class DepartmentUpdateRequest(
    val name: String? = null,
    val code: String? = null,
    val active: Boolean? = null,
    val facultyId: Long? = null
)
