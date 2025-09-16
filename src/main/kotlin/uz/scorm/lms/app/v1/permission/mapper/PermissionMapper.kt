package uz.scorm.lms.app.v1.permission.mapper

import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.permission.dto.PermissionDto
import uz.scorm.lms.app.v1.permission.model.Permission

@Component
class PermissionMapper {
    
    fun toDto(permission: Permission): PermissionDto {
        return PermissionDto(
            id = permission.id,
            code = permission.code,
            name = permission.name
        )
    }
    
    fun toEntity(dto: PermissionDto): Permission {
        return Permission(
            id = dto.id,
            code = dto.code,
            name = dto.name
        )
    }
}
