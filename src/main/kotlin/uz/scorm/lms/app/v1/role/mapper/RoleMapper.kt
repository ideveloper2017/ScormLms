package uz.scorm.lms.app.v1.role.mapper

import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.role.dto.RoleDto
import uz.scorm.lms.app.v1.role.model.Role

@Component
class RoleMapper {
    fun toDto(role: Role): RoleDto = RoleDto(id = role.id, name = role.name)
    fun toEntity(dto: RoleDto): Role = Role(id = dto.id, name = dto.name)
}