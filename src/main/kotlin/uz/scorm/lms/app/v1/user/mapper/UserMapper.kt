package uz.scorm.lms.app.v1.user.mapper

import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.role.mapper.RoleMapper
import uz.scorm.lms.app.v1.user.dto.UserDto
import uz.scorm.lms.app.v1.user.model.User

@Component
class UserMapper(
    private val roleMapper: RoleMapper
) {
    fun toDto(user: User): UserDto = UserDto(
        id = user.id,
        fullName = listOfNotNull(user.firstName, user.lastName).joinToString(" ").ifEmpty { null },
        username = user.username,
        email = user.email,
        phone = user.phone,
        role = user.role?.let { roleMapper.toDto(it) },
        status = user.status,
        createdAt = user.createdAt,
        updatedAt = user.updatedAt
    )
}
