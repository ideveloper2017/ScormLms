package uz.scorm.lms.app.v1.subjectcategory.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.v1.subjectcategory.dto.SubjectCategoryCreateRequest
import uz.scorm.lms.app.v1.subjectcategory.dto.SubjectCategoryUpdateRequest
import uz.scorm.lms.app.v1.subjectcategory.service.SubjectCategoryService

@RestController
@RequestMapping("/api/v1/subject-categories")
class SubjectCategoryController(private val service: SubjectCategoryService) {
    @GetMapping
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun list() = service.list()

    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(@RequestBody request: SubjectCategoryCreateRequest) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(request))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun update(@PathVariable id: Long, @RequestBody request: SubjectCategoryUpdateRequest) =
        service.update(id, request)

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> {
        service.delete(id)
        return ResponseEntity.noContent().build()
    }
}
