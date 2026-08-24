package uz.scorm.lms.app.v1.university.controller

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
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.university.dto.CreateUniversityRequest
import uz.scorm.lms.app.v1.university.dto.UpdateUniversityRequest
import uz.scorm.lms.app.v1.university.service.UniversityService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/universities")
class UniversityController(private val service: UniversityService) {
    @GetMapping
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun list() = service.list()

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun get(@PathVariable id: Long) = service.get(id)

    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(@RequestBody request: CreateUniversityRequest, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, requireNotNull(user.id)))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun update(@PathVariable id: Long, @RequestBody request: UpdateUniversityRequest, @CurrentUser user: User) =
        service.update(id, request, requireNotNull(user.id))

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun delete(@PathVariable id: Long, @CurrentUser user: User): ResponseEntity<Void> {
        service.delete(id, requireNotNull(user.id))
        return ResponseEntity.noContent().build()
    }
}
