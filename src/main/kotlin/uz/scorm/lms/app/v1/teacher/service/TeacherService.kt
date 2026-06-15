package uz.scorm.lms.app.v1.teacher.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.department.service.DepartmentService
import uz.scorm.lms.app.v1.subject.service.SubjectService
import uz.scorm.lms.app.v1.teacher.dto.TeacherCreateRequest
import uz.scorm.lms.app.v1.teacher.dto.TeacherDto
import uz.scorm.lms.app.v1.teacher.dto.TeacherUpdateRequest
import uz.scorm.lms.app.v1.teacher.mapper.TeacherMapper
import uz.scorm.lms.app.v1.teacher.model.Teacher
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import uz.scorm.lms.app.v1.user.service.UserService

@Service
class TeacherService(
    private val teacherRepository: TeacherRepository,
    private val teacherMapper: TeacherMapper,
    private val departmentService: DepartmentService,
    private val subjectService: SubjectService,
    private val userService: UserService
) {
    fun list(departmentId: Long? = null): List<TeacherDto> {
        val items = if (departmentId != null) {
            teacherRepository.findAllByDepartmentId(departmentId)
        } else {
            teacherRepository.findAll()
        }
        return items.map(teacherMapper::toDto)
    }

    fun getById(id: Long): TeacherDto =
        teacherMapper.toDto(getEntity(id))

    fun getEntity(id: Long): Teacher =
        teacherRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Teacher not found: $id") }

    @Transactional
    fun create(request: TeacherCreateRequest): TeacherDto {
        val teacher = Teacher(
            fullName = request.fullName,
            phone = request.phone,
            email = request.email,
            academicDegree = request.academicDegree,
            academicRank = request.academicRank,
            position = request.position,
            active = request.active,
            department = request.departmentId?.let { departmentService.getEntity(it) },
            subjects = request.subjectIds.map { subjectService.getEntity(it) }.toMutableSet()
        )
        // Ixtiyoriy login akkaunti
        if (!request.username.isNullOrBlank() && !request.password.isNullOrBlank()) {
            teacher.user = userService.register(request.username, request.password, "teacher")
        }
        return teacherMapper.toDto(teacherRepository.save(teacher))
    }

    @Transactional
    fun update(id: Long, request: TeacherUpdateRequest): TeacherDto {
        val teacher = getEntity(id)
        request.fullName?.let { teacher.fullName = it }
        request.phone?.let { teacher.phone = it }
        request.email?.let { teacher.email = it }
        request.academicDegree?.let { teacher.academicDegree = it }
        request.academicRank?.let { teacher.academicRank = it }
        request.position?.let { teacher.position = it }
        request.active?.let { teacher.active = it }
        request.departmentId?.let { teacher.department = departmentService.getEntity(it) }
        request.subjectIds?.let { ids ->
            teacher.subjects = ids.map { subjectService.getEntity(it) }.toMutableSet()
        }
        return teacherMapper.toDto(teacherRepository.save(teacher))
    }

    @Transactional
    fun delete(id: Long) {
        teacherRepository.delete(getEntity(id))
    }
}
