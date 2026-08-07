package uz.scorm.lms.app.v1.restriction.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.restriction.dto.PublishDistanceProgramRestrictionCatalogRequest
import uz.scorm.lms.app.v1.restriction.dto.SaveDistanceProgramRestrictionCatalogRequest
import uz.scorm.lms.app.v1.restriction.service.DistanceProgramRestrictionService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/distance-program-restrictions")
class DistanceProgramRestrictionController(private val service: DistanceProgramRestrictionService) {
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ACADEMIC_READ', 'STAT_READ', 'AUDIT_READ')")
    fun list() = service.list()

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ACADEMIC_READ', 'STAT_READ', 'AUDIT_READ')")
    fun get(@PathVariable id: Long) = service.get(id)

    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(@RequestBody request: SaveDistanceProgramRestrictionCatalogRequest, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, requireNotNull(user.id)))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun update(@PathVariable id: Long, @RequestBody request: SaveDistanceProgramRestrictionCatalogRequest, @CurrentUser user: User) =
        service.update(id, request, requireNotNull(user.id))

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun publish(@PathVariable id: Long, @RequestBody request: PublishDistanceProgramRestrictionCatalogRequest, @CurrentUser user: User) =
        service.publish(id, request, requireNotNull(user.id))

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun archive(@PathVariable id: Long, @CurrentUser user: User) = service.archive(id, requireNotNull(user.id))
}
