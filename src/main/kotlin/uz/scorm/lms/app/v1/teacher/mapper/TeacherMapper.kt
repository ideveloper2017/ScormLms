package uz.scorm.lms.app.v1.teacher.mapper

import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.teacher.dto.SubjectRef
import uz.scorm.lms.app.v1.teacher.dto.TeacherDto
import uz.scorm.lms.app.v1.teacher.model.Teacher

@Component
class TeacherMapper {

    fun toDto(teacher: Teacher): TeacherDto = TeacherDto(
        id = teacher.id,
        fullName = teacher.fullName,
        phone = teacher.phone,
        email = teacher.email,
        academicDegree = teacher.academicDegree,
        academicRank = teacher.academicRank,
        position = teacher.position,
        active = teacher.active,
        departmentId = teacher.department?.id,
        departmentName = teacher.department?.name,
        userId = teacher.user?.id,
        username = teacher.user?.username,
        subjects = teacher.subjects.map { SubjectRef(id = it.id!!, name = it.name) },
        createdAt = teacher.createdAt,
        updatedAt = teacher.updatedAt
    )
}
