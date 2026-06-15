package uz.scorm.lms.app.v1.department.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.department.dto.DepartmentCreateRequest
import uz.scorm.lms.app.v1.department.dto.DepartmentDto
import uz.scorm.lms.app.v1.department.dto.DepartmentUpdateRequest
import uz.scorm.lms.app.v1.department.service.DepartmentService

@RestController
@RequestMapping("/api/v1/departments")
class DepartmentController(
    private val departmentService: DepartmentService
) {
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    @GetMapping
    fun list(@RequestParam(required = false) facultyId: Long?): ResponseEntity<List<DepartmentDto>> =
        ResponseEntity.ok(departmentService.list(facultyId))

    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<DepartmentDto> =
        ResponseEntity.ok(departmentService.getById(id))

    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    @PostMapping
    fun create(@RequestBody request: DepartmentCreateRequest): ResponseEntity<DepartmentDto> =
        ResponseEntity.status(HttpStatus.CREATED).body(departmentService.create(request))

    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: DepartmentUpdateRequest
    ): ResponseEntity<DepartmentDto> =
        ResponseEntity.ok(departmentService.update(id, request))

    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> {
        departmentService.delete(id)
        return ResponseEntity.noContent().build()
    }
}
