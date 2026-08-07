package uz.scorm.lms.app.v1.practice.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.practice.dto.CompleteStudentPracticeRequest
import uz.scorm.lms.app.v1.practice.dto.SaveStudentPracticeRequest
import uz.scorm.lms.app.v1.practice.dto.StudentPracticeDto
import uz.scorm.lms.app.v1.practice.service.StudentPracticeService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/practices")
class StudentPracticeController(private val service: StudentPracticeService) {
    @GetMapping
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun list(): List<StudentPracticeDto> = service.list()

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun get(@PathVariable id: Long): StudentPracticeDto = service.get(id)

    @GetMapping("/eligible-students")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun eligibleStudents() = service.eligibleStudents()

    @GetMapping("/mine")
    @PreAuthorize("hasAuthority('STUDENT_READ')")
    fun mine(@CurrentUser user: User): List<StudentPracticeDto> = service.mine(requireNotNull(user.id))

    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(@RequestBody request: SaveStudentPracticeRequest, @CurrentUser user: User): ResponseEntity<StudentPracticeDto> =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, requireNotNull(user.id)))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun update(@PathVariable id: Long, @RequestBody request: SaveStudentPracticeRequest, @CurrentUser user: User) =
        service.update(id, request, requireNotNull(user.id))

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun approve(@PathVariable id: Long, @CurrentUser user: User) = service.approve(id, requireNotNull(user.id))

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun complete(
        @PathVariable id: Long,
        @RequestBody request: CompleteStudentPracticeRequest,
        @CurrentUser user: User,
    ) = service.complete(id, request, requireNotNull(user.id))

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun cancel(@PathVariable id: Long, @CurrentUser user: User) = service.cancel(id, requireNotNull(user.id))
}
