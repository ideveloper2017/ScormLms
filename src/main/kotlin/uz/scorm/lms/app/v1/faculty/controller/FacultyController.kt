package uz.scorm.lms.app.v1.faculty.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.faculty.dto.FacultyCreateRequest
import uz.scorm.lms.app.v1.faculty.dto.FacultyDto
import uz.scorm.lms.app.v1.faculty.dto.FacultyUpdateRequest
import uz.scorm.lms.app.v1.faculty.service.FacultyService

@RestController
@RequestMapping("/api/v1/faculties")
class FacultyController(
    private val facultyService: FacultyService
) {
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    @GetMapping
    fun list(): ResponseEntity<List<FacultyDto>> =
        ResponseEntity.ok(facultyService.list())

    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<FacultyDto> =
        ResponseEntity.ok(facultyService.getById(id))

    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    @PostMapping
    fun create(@RequestBody request: FacultyCreateRequest): ResponseEntity<FacultyDto> =
        ResponseEntity.status(HttpStatus.CREATED).body(facultyService.create(request))

    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: FacultyUpdateRequest
    ): ResponseEntity<FacultyDto> =
        ResponseEntity.ok(facultyService.update(id, request))

    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> {
        facultyService.delete(id)
        return ResponseEntity.noContent().build()
    }
}
