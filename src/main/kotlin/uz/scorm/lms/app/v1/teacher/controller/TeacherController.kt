package uz.scorm.lms.app.v1.teacher.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.teacher.dto.TeacherCreateRequest
import uz.scorm.lms.app.v1.teacher.dto.TeacherDto
import uz.scorm.lms.app.v1.teacher.dto.TeacherUpdateRequest
import uz.scorm.lms.app.v1.teacher.service.TeacherService

@RestController
@RequestMapping("/api/v1/teachers")
class TeacherController(
    private val teacherService: TeacherService
) {
    @PreAuthorize("hasAuthority('TEACHER_READ')")
    @GetMapping
    fun list(@RequestParam(required = false) departmentId: Long?): ResponseEntity<List<TeacherDto>> =
        ResponseEntity.ok(teacherService.list(departmentId))

    @PreAuthorize("hasAuthority('TEACHER_READ')")
    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<TeacherDto> =
        ResponseEntity.ok(teacherService.getById(id))

    @PreAuthorize("hasAuthority('TEACHER_WRITE')")
    @PostMapping
    fun create(@RequestBody request: TeacherCreateRequest): ResponseEntity<TeacherDto> =
        ResponseEntity.status(HttpStatus.CREATED).body(teacherService.create(request))

    @PreAuthorize("hasAuthority('TEACHER_WRITE')")
    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: TeacherUpdateRequest
    ): ResponseEntity<TeacherDto> =
        ResponseEntity.ok(teacherService.update(id, request))

    @PreAuthorize("hasAuthority('TEACHER_WRITE')")
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> {
        teacherService.delete(id)
        return ResponseEntity.noContent().build()
    }
}
