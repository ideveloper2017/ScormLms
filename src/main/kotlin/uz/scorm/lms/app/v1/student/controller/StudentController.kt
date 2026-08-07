package uz.scorm.lms.app.v1.student.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.student.dto.*
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.student.service.StudentService
import uz.scorm.lms.app.v1.student.service.StudentLifecycleService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/students")
class StudentController(
    private val studentService: StudentService,
    private val lifecycleService: StudentLifecycleService,
) {

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
    fun create(@RequestBody req: StudentAdmissionRequest, @CurrentUser user: User): ResponseEntity<StudentLifecycleResultDto> =
        ResponseEntity.status(HttpStatus.CREATED).body(lifecycleService.admit(req, requireNotNull(user.id)))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun update(@PathVariable id: Long, @RequestBody req: StudentUpdateRequest): StudentDto =
        studentService.update(id, req)

    @GetMapping("/{id}/lifecycle")
    @PreAuthorize("hasAuthority('USER_READ')")
    fun lifecycle(@PathVariable id: Long): List<StudentLifecycleEventDto> = lifecycleService.history(id)

    @PostMapping("/{id}/lifecycle")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun transition(
        @PathVariable id: Long,
        @RequestBody req: StudentLifecycleRequest,
        @CurrentUser user: User,
    ): StudentLifecycleResultDto = lifecycleService.transition(id, req, requireNotNull(user.id))

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
