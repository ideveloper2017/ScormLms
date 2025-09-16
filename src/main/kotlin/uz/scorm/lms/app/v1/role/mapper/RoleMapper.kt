package uz.scorm.lms.app.v1.role.mapper

import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.permission.mapper.PermissionMapper
import uz.scorm.lms.app.v1.role.dto.RoleDto
import uz.scorm.lms.app.v1.role.model.Role

@Component
class RoleMapper(
    private val permissionMapper: PermissionMapper
) {
    
    fun toDto(role: Role): RoleDto {
        return RoleDto(
            id = role.id,
            name = role.name,
            permissionDto = role.permissions.map { permissionMapper.toDto(it) }
        )
    }
    
    fun toEntity(dto: RoleDto): Role {
        return Role(
            id = dto.id,
            name = dto.name,
            permissions = dto.permissionDto.map { permissionMapper.toEntity(it) }.toMutableSet()
        )
    }
}
