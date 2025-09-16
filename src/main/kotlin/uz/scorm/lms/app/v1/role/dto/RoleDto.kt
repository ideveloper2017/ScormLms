package uz.scorm.lms.app.v1.role.dto

import uz.scorm.lms.app.v1.permission.dto.PermissionDto

data class RoleDto(
    val id: Long? = null,
    val name: String,
    var permissionDto: List<PermissionDto> = emptyList()
)