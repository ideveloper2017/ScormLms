package uz.scorm.lms.app.v1.program.mapper

import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.program.dto.ProgramDto
import uz.scorm.lms.app.v1.program.model.Program

@Component
class ProgramMapper {

    fun toDto(program: Program): ProgramDto = ProgramDto(
        id = program.id,
        name = program.name,
        code = program.code,
        degreeLevel = program.degreeLevel,
        active = program.active,
        departmentId = program.department?.id,
        departmentName = program.department?.name,
        createdAt = program.createdAt,
        updatedAt = program.updatedAt
    )
}
