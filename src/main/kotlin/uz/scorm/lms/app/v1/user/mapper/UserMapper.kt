package uz.scorm.lms.app.v1.user.mapper

import org.springframework.stereotype.Component
import uz.scorm.lms.app.security.RolePermissions
import uz.scorm.lms.app.v1.role.mapper.RoleMapper
import uz.scorm.lms.app.v1.user.dto.UserDto
import uz.scorm.lms.app.v1.user.model.User

@Component
class UserMapper(private val roleMapper: RoleMapper) {

    fun toDto(user: User): UserDto = UserDto(
        id = user.id,
        fullName = user.fullName,
        username = user.username,
        email = user.email,
        phone = user.phone,
        jshshir = user.jshshir,
        faculty = user.faculty,
        direction = user.direction,
        groupName = user.groupName,
        role = user.role?.let { roleMapper.toDto(it) },
        permissions = RolePermissions.forRole(user.role?.name),
        status = user.status,
        createdAt = user.createdAt,
        updatedAt = user.updatedAt
    )
}
