package uz.scorm.lms.app.v1.syllabus.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusRequest
import uz.scorm.lms.app.v1.syllabus.service.SubjectSyllabusService

@RestController
@RequestMapping("/api/v1/syllabi")
class SubjectSyllabusController(private val service: SubjectSyllabusService) {
    @GetMapping
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun list(@RequestParam(required = false) subjectId: Long?) = service.list(subjectId)

    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(@RequestBody request: SubjectSyllabusRequest) = ResponseEntity.status(HttpStatus.CREATED).body(service.create(request))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun update(@PathVariable id: Long, @RequestBody request: SubjectSyllabusRequest) = service.update(id, request)

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> { service.delete(id); return ResponseEntity.noContent().build() }
}
