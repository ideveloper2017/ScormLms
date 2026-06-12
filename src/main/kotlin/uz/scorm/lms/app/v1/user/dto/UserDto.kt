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
    val jshshir: String? = null,
    val faculty: String? = null,
    val direction: String? = null,
    val groupName: String? = null,
    val role: RoleDto? = null,
    val permissions: List<String> = emptyList(),
    val status: UserStatus = UserStatus.ACTIVE,
    val createdAt: Instant? = null,
    val updatedAt: Instant? = null
)

data class UserCreateRequest(
    val fullName: String? = null,
    val username: String,
    val email: String? = null,
    val phone: String? = null,
    val jshshir: String? = null,
    val faculty: String? = null,
    val direction: String? = null,
    val groupName: String? = null,
    val password: String,
    val roleCode: String
)

data class UserUpdateRequest(
    val fullName: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val jshshir: String? = null,
    val faculty: String? = null,
    val direction: String? = null,
    val groupName: String? = null,
    val roleCode: String? = null,
    val status: UserStatus? = null
)

data class PasswordChangeRequest(
    val currentPassword: String,
    val newPassword: String
)

data class PasswordResetRequest(
    val newPassword: String
)

data class ForgotPasswordRequest(
    val email: String
)

data class ResetPasswordWithTokenRequest(
    val token: String,
    val newPassword: String
)

data class UserImportRequest(
    val users: List<UserCreateRequest>
)
