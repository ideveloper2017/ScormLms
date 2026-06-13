package uz.scorm.lms.app.v1.subject.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.subject.dto.SubjectCreateRequest
import uz.scorm.lms.app.v1.subject.dto.SubjectDto
import uz.scorm.lms.app.v1.subject.dto.SubjectUpdateRequest
import uz.scorm.lms.app.v1.subject.service.SubjectService

@RestController
@RequestMapping("/api/v1/subjects")
class SubjectController(
    private val subjectService: SubjectService
) {
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    @GetMapping
    fun list(@RequestParam(required = false) programId: Long?): ResponseEntity<List<SubjectDto>> =
        ResponseEntity.ok(subjectService.list(programId))

    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<SubjectDto> =
        ResponseEntity.ok(subjectService.getById(id))

    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    @PostMapping
    fun create(@RequestBody request: SubjectCreateRequest): ResponseEntity<SubjectDto> =
        ResponseEntity.status(HttpStatus.CREATED).body(subjectService.create(request))

    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: SubjectUpdateRequest
    ): ResponseEntity<SubjectDto> =
        ResponseEntity.ok(subjectService.update(id, request))

    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> {
        subjectService.delete(id)
        return ResponseEntity.noContent().build()
    }
}
