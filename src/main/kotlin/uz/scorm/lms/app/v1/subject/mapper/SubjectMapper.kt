package uz.scorm.lms.app.v1.subject.mapper

import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.subject.dto.SubjectDto
import uz.scorm.lms.app.v1.subject.model.Subject

@Component
class SubjectMapper {

    fun toDto(subject: Subject): SubjectDto = SubjectDto(
        id = subject.id,
        name = subject.name,
        nameEn = subject.nameEn,
        nameRu = subject.nameRu,
        nameKaa = subject.nameKaa,
        nameUzCyrillic = subject.nameUzCyrillic,
        code = subject.code,
        credits = subject.credits,
        subjectType = subject.subjectType,
        active = subject.active,
        programId = subject.program?.id,
        programName = subject.program?.name,
        subjectCategoryId = subject.subjectCategory?.id,
        subjectCategoryName = subject.subjectCategory?.name,
        createdAt = subject.createdAt,
        updatedAt = subject.updatedAt
    )
}
