package uz.scorm.lms.app.v1.department.mapper

import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.department.dto.DepartmentDto
import uz.scorm.lms.app.v1.department.model.Department

@Component
class DepartmentMapper {

    fun toDto(department: Department): DepartmentDto = DepartmentDto(
        id = department.id,
        name = department.name,
        code = department.code,
        active = department.active,
        facultyId = department.faculty?.id,
        facultyName = department.faculty?.name,
        createdAt = department.createdAt,
        updatedAt = department.updatedAt
    )
}
