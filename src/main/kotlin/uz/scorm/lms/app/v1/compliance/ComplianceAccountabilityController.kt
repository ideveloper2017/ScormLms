package uz.scorm.lms.app.v1.compliance

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
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/compliance/559/accountability-referrals")
class ComplianceAccountabilityController(private val service: ComplianceAccountabilityService) {
    @GetMapping
    @PreAuthorize("hasAnyAuthority('STAT_READ', 'ACADEMIC_READ', 'AUDIT_READ')")
    fun list(): ResponseEntity<ApiResponse<List<AccountabilityReferralDto>>> =
        ResponseEntity.ok(ApiResponse.success(service.list()))

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('STAT_READ', 'ACADEMIC_READ', 'AUDIT_READ')")
    fun get(@PathVariable id: Long): ResponseEntity<ApiResponse<AccountabilityReferralDto>> =
        ResponseEntity.ok(ApiResponse.success(service.get(id)))

    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(@RequestBody request: SaveAccountabilityReferralRequest, @CurrentUser user: User): ResponseEntity<ApiResponse<AccountabilityReferralDto>> =
        ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(service.create(request, requireNotNull(user.id))))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun update(@PathVariable id: Long, @RequestBody request: SaveAccountabilityReferralRequest, @CurrentUser user: User): ResponseEntity<ApiResponse<AccountabilityReferralDto>> =
        ResponseEntity.ok(ApiResponse.success(service.update(id, request, requireNotNull(user.id))))

    @PostMapping("/{id}/refer")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun refer(@PathVariable id: Long, @RequestBody request: ReferAccountabilityRequest, @CurrentUser user: User): ResponseEntity<ApiResponse<AccountabilityReferralDto>> =
        ResponseEntity.ok(ApiResponse.success(service.refer(id, request, requireNotNull(user.id))))

    @PostMapping("/{id}/decision")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun decision(@PathVariable id: Long, @RequestBody request: RecordAccountabilityDecisionRequest, @CurrentUser user: User): ResponseEntity<ApiResponse<AccountabilityReferralDto>> =
        ResponseEntity.ok(ApiResponse.success(service.recordDecision(id, request, requireNotNull(user.id))))
}
