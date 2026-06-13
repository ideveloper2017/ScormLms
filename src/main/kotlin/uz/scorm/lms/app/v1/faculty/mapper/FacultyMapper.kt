package uz.scorm.lms.app.v1.faculty.mapper

import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.faculty.dto.FacultyDto
import uz.scorm.lms.app.v1.faculty.model.Faculty

@Component
class FacultyMapper {

    fun toDto(faculty: Faculty): FacultyDto = FacultyDto(
        id = faculty.id,
        name = faculty.name,
        code = faculty.code,
        active = faculty.active,
        createdAt = faculty.createdAt,
        updatedAt = faculty.updatedAt
    )
}
