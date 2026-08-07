package uz.scorm.lms.app.v1.disclosure.controller

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
import uz.scorm.lms.app.v1.disclosure.dto.ReviewOfficialSitePublicationRequest
import uz.scorm.lms.app.v1.disclosure.dto.SaveOfficialSitePublicationRequest
import uz.scorm.lms.app.v1.disclosure.service.OfficialSitePublicationService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/official-site-publications")
@PreAuthorize("hasAnyAuthority('ACADEMIC_READ', 'AUDIT_READ')")
class OfficialSitePublicationController(private val service: OfficialSitePublicationService) {
    @GetMapping fun list() = service.list()
    @GetMapping("/{id}") fun get(@PathVariable id: Long) = service.get(id)

    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(@RequestBody request: SaveOfficialSitePublicationRequest, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, requireNotNull(user.id)))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun update(@PathVariable id: Long, @RequestBody request: SaveOfficialSitePublicationRequest, @CurrentUser user: User) =
        service.update(id, request, requireNotNull(user.id))

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun publish(@PathVariable id: Long, @RequestBody request: ReviewOfficialSitePublicationRequest, @CurrentUser user: User) =
        service.publish(id, request, requireNotNull(user.id))

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun reject(@PathVariable id: Long, @RequestBody request: ReviewOfficialSitePublicationRequest, @CurrentUser user: User) =
        service.reject(id, request, requireNotNull(user.id))

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun archive(@PathVariable id: Long, @CurrentUser user: User) = service.archive(id, requireNotNull(user.id))
}

@RestController
@RequestMapping("/public/api/institution-disclosures")
class PublicInstitutionDisclosureController(private val service: OfficialSitePublicationService) {
    @GetMapping fun disclosure() = service.publicDisclosure()
}
