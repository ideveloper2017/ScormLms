package uz.scorm.lms.app.v1.syllabus.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.syllabus.dto.SubjectModelProgramRequest
import uz.scorm.lms.app.v1.syllabus.service.SubjectModelProgramService

/** O'quv dasturlari (namunaviy). */
@RestController
@RequestMapping("/api/v1/model-programs")
class SubjectModelProgramController(private val service: SubjectModelProgramService) {
    @GetMapping
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun list() = service.list()

    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(@RequestBody request: SubjectModelProgramRequest) = ResponseEntity.status(HttpStatus.CREATED).body(service.create(request))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun update(@PathVariable id: Long, @RequestBody request: SubjectModelProgramRequest) = service.update(id, request)

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> { service.delete(id); return ResponseEntity.noContent().build() }
}
