package uz.scorm.lms.app.v1.subject.mapper

import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.subject.dto.SubjectDto
import uz.scorm.lms.app.v1.subject.model.Subject

@Component
class SubjectMapper {

    fun toDto(subject: Subject): SubjectDto = SubjectDto(
        id = subject.id,
        name = subject.name,
        code = subject.code,
        credits = subject.credits,
        active = subject.active,
        programId = subject.program?.id,
        programName = subject.program?.name,
        createdAt = subject.createdAt,
        updatedAt = subject.updatedAt
    )
}
