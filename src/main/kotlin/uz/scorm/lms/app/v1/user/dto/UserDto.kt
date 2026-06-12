package uz.scorm.lms.app.v1.user.dto

import uz.scorm.lms.app.v1.role.dto.RoleDto
import uz.scorm.lms.app.v1.user.model.UserStatus
import java.time.Instant

data class UserDto(
    val id: Long? = null,
    val fullName: String? = null,
    val username: String,
    val email: String? = null,
    val phone: String? = null,
    val role: RoleDto? = null,
    val status: UserStatus = UserStatus.ACTIVE,
    val createdAt: Instant? = null,
    val updatedAt: Instant? = null
)

data class UserCreateRequest(
    val fullName: String? = null,
    val username: String,
    val email: String? = null,
    val phone: String? = null,
    val password: String,
    val roleCode: String
)

data class UserUpdateRequest(
    val fullName: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val roleCode: String? = null,
    val status: UserStatus? = null
)
