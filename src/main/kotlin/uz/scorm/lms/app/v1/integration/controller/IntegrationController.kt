package uz.scorm.lms.app.v1.integration.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.integration.dto.*
import uz.scorm.lms.app.v1.integration.service.IntegrationOutboxService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/integrations")
@PreAuthorize("hasAuthority('INTEGRATION_READ')")
class IntegrationController(private val service: IntegrationOutboxService) {
    @GetMapping("/metrics")
    fun metrics(authentication: Authentication): ResponseEntity<ApiResponse<IntegrationMetricsDto>> =
        ResponseEntity.ok(ApiResponse.success(service.metrics(canManage(authentication))))

    @GetMapping("/events")
    fun events(
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) connector: String?,
        @RequestParam(defaultValue = "false") errorOnly: Boolean,
        @RequestParam(defaultValue = "100") limit: Int,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<List<IntegrationEventDto>>> = ResponseEntity.ok(ApiResponse.success(
        service.events(status, connector, errorOnly, limit, canManage(authentication)),
    ))

    @GetMapping("/events/{id}")
    fun detail(
        @PathVariable id: Long,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<IntegrationEventDetailDto>> =
        ResponseEntity.ok(ApiResponse.success(service.detail(id, canManage(authentication))))

    @PostMapping("/process-due")
    @PreAuthorize("hasAuthority('INTEGRATION_WRITE')")
    fun processDue(
        @RequestParam(defaultValue = "100") limit: Int,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<IntegrationProcessResultDto>> =
        ResponseEntity.ok(ApiResponse.success(service.processDue(limit, requireNotNull(user.id))))

    @PostMapping("/events/{id}/retry")
    @PreAuthorize("hasAuthority('INTEGRATION_WRITE')")
    fun retry(
        @PathVariable id: Long,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<IntegrationEventDto>> =
        ResponseEntity.ok(ApiResponse.success(service.retry(id, requireNotNull(user.id))))

    private fun canManage(authentication: Authentication): Boolean =
        authentication.authorities.any { it.authority == "INTEGRATION_WRITE" }
}
