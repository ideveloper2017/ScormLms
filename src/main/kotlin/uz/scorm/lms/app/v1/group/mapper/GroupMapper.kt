package uz.scorm.lms.app.v1.group.mapper

import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.group.dto.GroupDto
import uz.scorm.lms.app.v1.group.model.Group

@Component
class GroupMapper {

    fun toDto(group: Group): GroupDto = GroupDto(
        id = group.id,
        name = group.name,
        educationYear = group.educationYear,
        language = group.language,
        active = group.active,
        programId = group.program?.id,
        programName = group.program?.name,
        createdAt = group.createdAt,
        updatedAt = group.updatedAt
    )
}
