package uz.scorm.lms.app.v1.admission.controller

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
import uz.scorm.lms.app.v1.admission.dto.ApproveDistanceAdmissionPolicyRequest
import uz.scorm.lms.app.v1.admission.dto.SaveDistanceAdmissionPolicyRequest
import uz.scorm.lms.app.v1.admission.service.DistanceAdmissionPolicyService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/distance-admission-policies")
class DistanceAdmissionPolicyController(private val service: DistanceAdmissionPolicyService) {
    @GetMapping
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun list() = service.list()

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun get(@PathVariable id: Long) = service.get(id)

    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(@RequestBody request: SaveDistanceAdmissionPolicyRequest, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, requireNotNull(user.id)))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun update(@PathVariable id: Long, @RequestBody request: SaveDistanceAdmissionPolicyRequest, @CurrentUser user: User) =
        service.update(id, request, requireNotNull(user.id))

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun approve(@PathVariable id: Long, @RequestBody request: ApproveDistanceAdmissionPolicyRequest, @CurrentUser user: User) =
        service.approve(id, request, requireNotNull(user.id))

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun archive(@PathVariable id: Long, @CurrentUser user: User) = service.archive(id, requireNotNull(user.id))
}
