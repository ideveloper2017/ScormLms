package uz.scorm.lms.app.v1.student.controller

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.student.dto.StudentDto
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.service.StudentService

@RestController
@RequestMapping("/api/v1/students")
class StudentController(private val studentService: StudentService) {

    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    fun listStudents(): List<StudentDto> {
        return studentService.listAll()
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun createStudent(@RequestBody dto: StudentDto): StudentDto {
        return studentService.createStudent(dto)
    }

    @PutMapping("/{username}/status")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun updateStatus(@PathVariable username: String, @RequestParam status: StudentStatus): StudentDto {
        return studentService.updateStatus(username, status)
    }

    @PutMapping("/{username}/promote")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun promote(@PathVariable username: String): StudentDto {
        return studentService.promoteStudent(username)
    }

    @PutMapping("/{username}/graduate")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun graduate(@PathVariable username: String): StudentDto {
        return studentService.graduateStudent(username)
    }

    @PutMapping("/{username}/archive")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun archive(@PathVariable username: String): StudentDto {
        return studentService.archiveStudent(username)
    }

    @PutMapping("/{username}/reinstate")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun reinstate(@PathVariable username: String): StudentDto {
        return studentService.reinstateStudent(username)
    }

    @PutMapping("/{username}/group")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun assignGroup(@PathVariable username: String, @RequestParam groupName: String): StudentDto {
        return studentService.assignGroup(username, groupName)
    }

    @PutMapping("/{username}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun editStudent(@PathVariable username: String, @RequestBody dto: StudentDto): StudentDto {
        return studentService.editStudent(username, dto)
    }
}
