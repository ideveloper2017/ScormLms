package uz.scorm.lms.app.v1.user.dto

import uz.scorm.lms.app.v1.role.dto.RoleDto
import uz.scorm.lms.app.v1.role.model.Role
import uz.scorm.lms.app.v1.user.model.User

data class UserDto(
    val id: Long? = null,
    val username: String,
    val phone: String?,
    val firstName: String?,
    val lastName: String?,
    val photo: String?,
    var enabled: Boolean,
    val email: String?,
    val emailVerified: Boolean,
    val twoFactorEnabled: Boolean,
    val roles: MutableSet<Role> = mutableSetOf()


){
    companion object {
        fun fromUser(user: User?): UserDto? {
            return user?.let {
                UserDto(
                    id = it.id,
                    username = it.username,
                    phone = it.phone,
                    photo=it.photo,
                    email = it.email,
                    firstName = it.firstName,
                    lastName = it.lastName,
                    enabled = it.enabled,
                    emailVerified = it.emailVerified,
                    twoFactorEnabled = it.twoFactorEnabled,
                    roles = it.roles.map { it } as MutableSet<Role>
                )
            }
        }
    }
}

