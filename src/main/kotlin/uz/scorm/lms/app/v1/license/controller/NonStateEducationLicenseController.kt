package uz.scorm.lms.app.v1.license.controller

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
import uz.scorm.lms.app.v1.license.dto.AddLicenseProgramScopeRequest
import uz.scorm.lms.app.v1.license.dto.RevokeNonStateEducationLicenseRequest
import uz.scorm.lms.app.v1.license.dto.SaveNonStateEducationLicenseRequest
import uz.scorm.lms.app.v1.license.dto.VerifyNonStateEducationLicenseRequest
import uz.scorm.lms.app.v1.license.service.NonStateEducationLicenseService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/non-state-licenses")
class NonStateEducationLicenseController(private val service: NonStateEducationLicenseService) {
    @GetMapping @PreAuthorize("hasAuthority('ACADEMIC_READ')") fun list() = service.list()
    @GetMapping("/{id}") @PreAuthorize("hasAuthority('ACADEMIC_READ')") fun get(@PathVariable id: Long) = service.get(id)
    @PostMapping @PreAuthorize("hasAuthority('ACADEMIC_WRITE')") fun create(@RequestBody request: SaveNonStateEducationLicenseRequest, @CurrentUser user: User) = ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, requireNotNull(user.id)))
    @PutMapping("/{id}") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')") fun update(@PathVariable id: Long, @RequestBody request: SaveNonStateEducationLicenseRequest, @CurrentUser user: User) = service.update(id, request, requireNotNull(user.id))
    @PostMapping("/{id}/scopes") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')") fun addScope(@PathVariable id: Long, @RequestBody request: AddLicenseProgramScopeRequest, @CurrentUser user: User) = service.addScope(id, request, requireNotNull(user.id))
    @DeleteMapping("/{id}/scopes/{scopeId}") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')") fun removeScope(@PathVariable id: Long, @PathVariable scopeId: Long, @CurrentUser user: User) = service.removeScope(id, scopeId, requireNotNull(user.id))
    @PostMapping("/{id}/verify") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')") fun verify(@PathVariable id: Long, @RequestBody request: VerifyNonStateEducationLicenseRequest, @CurrentUser user: User) = service.verify(id, request, requireNotNull(user.id))
    @PostMapping("/{id}/revoke") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')") fun revoke(@PathVariable id: Long, @RequestBody request: RevokeNonStateEducationLicenseRequest, @CurrentUser user: User) = service.revoke(id, request, requireNotNull(user.id))
}
