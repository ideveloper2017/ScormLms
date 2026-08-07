package uz.scorm.lms.app.v1.biometric.controller

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
import uz.scorm.lms.app.v1.biometric.dto.AcceptBiometricConsentRequest
import uz.scorm.lms.app.v1.biometric.dto.PublishBiometricPolicyRequest
import uz.scorm.lms.app.v1.biometric.dto.SaveBiometricPolicyRequest
import uz.scorm.lms.app.v1.biometric.dto.WithdrawBiometricConsentRequest
import uz.scorm.lms.app.v1.biometric.service.BiometricDataErasureService
import uz.scorm.lms.app.v1.biometric.service.BiometricGovernanceService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/biometric-governance")
class BiometricGovernanceController(
    private val service: BiometricGovernanceService,
    private val erasureService: BiometricDataErasureService,
) {
    @GetMapping("/policies")
    @PreAuthorize("hasAnyAuthority('USER_MANAGE', 'AUDIT_READ')")
    fun policies() = service.listPolicies()

    @PostMapping("/policies")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun create(@RequestBody request: SaveBiometricPolicyRequest, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, requireNotNull(user.id)))

    @PutMapping("/policies/{id}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun update(@PathVariable id: Long, @RequestBody request: SaveBiometricPolicyRequest, @CurrentUser user: User) =
        service.update(id, request, requireNotNull(user.id))

    @PostMapping("/policies/{id}/publish")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun publish(@PathVariable id: Long, @RequestBody request: PublishBiometricPolicyRequest, @CurrentUser user: User) =
        service.publish(id, request, requireNotNull(user.id))

    @PostMapping("/policies/{id}/archive")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun archive(@PathVariable id: Long, @CurrentUser user: User) = service.archive(id, requireNotNull(user.id))

    @GetMapping("/me")
    fun myStatus(@CurrentUser user: User) = service.myStatus(requireNotNull(user.id))

    @PostMapping("/me/consent")
    fun accept(@RequestBody request: AcceptBiometricConsentRequest, @CurrentUser user: User) = service.accept(request, requireNotNull(user.id))

    @PostMapping("/me/withdraw")
    fun withdraw(@RequestBody request: WithdrawBiometricConsentRequest, @CurrentUser user: User) = service.withdraw(request, requireNotNull(user.id))

    @PostMapping("/retention/run")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun runRetention(@CurrentUser user: User) = erasureService.runRetention(requireNotNull(user.id))
}
