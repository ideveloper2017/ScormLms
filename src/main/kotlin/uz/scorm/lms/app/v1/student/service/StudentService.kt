package uz.scorm.lms.app.v1.student.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.student.dto.GroupDto
import uz.scorm.lms.app.v1.student.dto.StudentDto
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.service.UserService

@Service
class StudentService(
    private val studentRepository: StudentRepository,
    private val userService: UserService
) {

    @Transactional(readOnly = true)
    fun listAll(): List<StudentDto> {
        return studentRepository.findAll().map { toDto(it) }
    }

    @Transactional
    fun updateStatus(username: String, status: StudentStatus): StudentDto {
        val student = studentRepository.findByUserUsername(username)
            ?: throw NoSuchElementException("Student profile not found")
        student.status = status
        return toDto(studentRepository.save(student))
    }

    @Transactional
    fun promoteStudent(username: String): StudentDto {
        val student = studentRepository.findByUserUsername(username)
            ?: throw NoSuchElementException("Student profile not found")
        
        if (student.semester >= 2) {
            student.course += 1
            student.semester = 1
        } else {
            student.semester += 1
        }
        return toDto(studentRepository.save(student))
    }

    @Transactional
    fun graduateStudent(username: String): StudentDto {
        return updateStatus(username, StudentStatus.GRADUATED)
    }

    @Transactional
    fun archiveStudent(username: String): StudentDto {
        return updateStatus(username, StudentStatus.ARCHIVED)
    }

    @Transactional
    fun reinstateStudent(username: String): StudentDto {
        return updateStatus(username, StudentStatus.REINSTATED)
    }

    @Transactional
    fun assignGroup(username: String, groupName: String): StudentDto {
        val student = studentRepository.findByUserUsername(username)
            ?: throw NoSuchElementException("Student profile not found")
        student.groupName = groupName
        return toDto(studentRepository.save(student))
    }

    @Transactional
    fun createStudent(dto: StudentDto): StudentDto {
        val username = dto.username ?: "std_${dto.studentIdNumber}"
        val user = userService.register(username, "std123", listOf("ROLE_STUDENT"))
        
        user.firstName = dto.firstName
        user.lastName = dto.thirdName
        user.email = dto.email ?: "$username@std.uz"
        
        val profile = StudentProfile(
            user = user,
            jshshir = dto.studentIdNumber ?: "",
            faculty = dto.faculty?.name,
            educationPath = dto.specialty?.name,
            groupName = dto.group?.name,
            course = dto.level?.code?.toIntOrNull() ?: 1,
            semester = dto.semester?.code?.toIntOrNull() ?: 1,
            language = dto.group?.educationLang?.code ?: "uz",
            status = StudentStatus.ACTIVE
        )
        return toDto(studentRepository.save(profile))
    }

    @Transactional
    fun editStudent(username: String, dto: StudentDto): StudentDto {
        val student = studentRepository.findByUserUsername(username)
            ?: throw NoSuchElementException("Student profile not found")
        
        student.user.firstName = dto.firstName ?: student.user.firstName
        student.user.lastName = dto.thirdName ?: student.user.lastName
        student.jshshir = dto.studentIdNumber ?: student.jshshir
        student.groupName = dto.group?.name ?: student.groupName
        student.faculty = dto.faculty?.name ?: student.faculty
        student.educationPath = dto.specialty?.name ?: student.educationPath
        student.language = dto.group?.educationLang?.code ?: student.language
        
        return toDto(studentRepository.save(student))
    }

    fun toDto(student: StudentProfile): StudentDto {
        val fullName = "${student.user.firstName ?: ""} ${student.user.lastName ?: ""}".trim()
        
        return StudentDto(
            id = student.id,
            username = student.user.username,
            fullName = fullName,
            firstName = student.user.firstName,
            thirdName = student.user.lastName,
            studentIdNumber = student.jshshir,
            group = GroupDto(name = student.groupName, educationLang = uz.scorm.lms.app.v1.student.dto.CodeNameDto(code = student.language)),
            level = uz.scorm.lms.app.v1.student.dto.CodeNameDto(code = student.course.toString()),
            semester = uz.scorm.lms.app.v1.student.dto.SemesterDto(code = student.semester.toString()),
            studentStatus = uz.scorm.lms.app.v1.student.dto.CodeNameDto(code = student.status.name),
            faculty = uz.scorm.lms.app.v1.student.dto.DepartmentDto(name = student.faculty),
            specialty = uz.scorm.lms.app.v1.student.dto.SpecialtyDto(name = student.educationPath)
        )
    }
}
