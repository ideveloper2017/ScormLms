package uz.scorm.lms.app.v1.tutorgroup.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.tutorgroup.dto.SaveTutorGroupRequest
import uz.scorm.lms.app.v1.tutorgroup.service.TutorGroupService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/tutor-groups")
@PreAuthorize("hasAuthority('ACADEMIC_READ')")
class TutorGroupController(private val service: TutorGroupService) {
    @GetMapping fun list() = service.list()
    @GetMapping("/options") fun options() = service.options()
    @PostMapping @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(@RequestBody request: SaveTutorGroupRequest, @CurrentUser user: User) = ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, requireNotNull(user.id)))
    @PutMapping("/{id}") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun update(@PathVariable id: Long, @RequestBody request: SaveTutorGroupRequest, @CurrentUser user: User) = service.update(id, request, requireNotNull(user.id))
    @DeleteMapping("/{id}") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun delete(@PathVariable id: Long, @CurrentUser user: User): ResponseEntity<Void> { service.delete(id, requireNotNull(user.id)); return ResponseEntity.noContent().build() }
}
