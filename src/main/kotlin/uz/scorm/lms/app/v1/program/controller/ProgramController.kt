package uz.scorm.lms.app.v1.program.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.program.dto.ProgramCreateRequest
import uz.scorm.lms.app.v1.program.dto.ProgramDto
import uz.scorm.lms.app.v1.program.dto.ProgramUpdateRequest
import uz.scorm.lms.app.v1.program.service.ProgramService

@RestController
@RequestMapping("/api/v1/programs")
class ProgramController(
    private val programService: ProgramService
) {
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    @GetMapping
    fun list(@RequestParam(required = false) departmentId: Long?): ResponseEntity<List<ProgramDto>> =
        ResponseEntity.ok(programService.list(departmentId))

    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<ProgramDto> =
        ResponseEntity.ok(programService.getById(id))

    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    @PostMapping
    fun create(@RequestBody request: ProgramCreateRequest): ResponseEntity<ProgramDto> =
        ResponseEntity.status(HttpStatus.CREATED).body(programService.create(request))

    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: ProgramUpdateRequest
    ): ResponseEntity<ProgramDto> =
        ResponseEntity.ok(programService.update(id, request))

    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> {
        programService.delete(id)
        return ResponseEntity.noContent().build()
    }
}
