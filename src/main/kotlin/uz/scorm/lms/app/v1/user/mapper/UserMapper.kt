package uz.scorm.lms.app.v1.user.mapper

import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.role.mapper.RoleMapper
import uz.scorm.lms.app.v1.user.dto.UserDto
import uz.scorm.lms.app.v1.user.model.User


@Component
class UserMapper(
    private val roleMapper: RoleMapper
) {
    
    fun toDto(user: User)= UserDto(
            id = user.id,
            username = user.username,
            phone = user.phone,
            photo = user.photo,
            enabled = user.enabled,
            firstName = user.firstName,
            lastName = user.lastName,
            email = user.email,
            emailVerified = user.emailVerified,
            twoFactorEnabled = user.twoFactorEnabled,
            roles = user.roles
        )

    
    fun toEntity(dto: UserDto): User {
        return User(
            username = dto.username,
            phone = dto.phone ?: "",
            photo = dto.photo ?: "",
            password = "", // Password should be handled separately
            firstName = dto.firstName,
            lastName = dto.lastName,
            email = dto.email,
            enabled = dto.enabled,
            emailVerified = dto.emailVerified,
            twoFactorEnabled = dto.twoFactorEnabled,
            roles = dto.roles.toMutableSet()
        ).apply {
            // Additional properties that might be needed
            enabled = true
        }
    }
    
    fun updateEntityFromDto(user: User, dto: UserDto): User {
        return user.apply {
            username = dto.username
            phone = dto.phone ?: ""
            photo = dto.photo ?: ""
            enabled = dto.enabled
            firstName = dto.firstName
            lastName = dto.lastName
            email = dto.email
            emailVerified = dto.emailVerified
            twoFactorEnabled = dto.twoFactorEnabled
            roles.clear()
            roles.addAll(dto.roles)
        }
    }
}
