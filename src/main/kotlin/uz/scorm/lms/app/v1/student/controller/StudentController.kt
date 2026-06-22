package uz.scorm.lms.app.v1.student.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.student.dto.*
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.service.StudentService

@RestController
@RequestMapping("/api/v1/students")
class StudentController(private val studentService: StudentService) {

    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    fun list(): List<StudentSummaryDto> = studentService.listAll()

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_READ')")
    fun getById(@PathVariable id: Long): StudentDto = studentService.getById(id)

    @GetMapping("/by-number/{studentNumber}")
    @PreAuthorize("hasAuthority('USER_READ')")
    fun getByStudentNumber(@PathVariable studentNumber: String): StudentDto =
        studentService.getByStudentNumber(studentNumber)

    @PostMapping
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun create(@RequestBody req: StudentCreateRequest): ResponseEntity<StudentDto> =
        ResponseEntity.status(HttpStatus.CREATED).body(studentService.create(req))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun update(@PathVariable id: Long, @RequestBody req: StudentUpdateRequest): StudentDto =
        studentService.update(id, req)

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun changeStatus(@PathVariable id: Long, @RequestParam status: StudentStatus): StudentDto =
        studentService.changeStatus(id, status)

    @PatchMapping("/{id}/promote")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun promote(@PathVariable id: Long): StudentDto = studentService.promote(id)

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> {
        studentService.delete(id)
        return ResponseEntity.noContent().build()
    }
}