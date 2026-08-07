package uz.scorm.lms.app.v1.hemis.sync.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.hemis.sync.dto.*
import uz.scorm.lms.app.v1.hemis.sync.service.HemisSyncService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/hemis/sync")
@PreAuthorize("hasAuthority('INTEGRATION_READ')")
class HemisSyncController(private val service: HemisSyncService) {
    @GetMapping("/overview")
    fun overview(authentication: Authentication) = ok(service.overview(canManage(authentication)))

    @GetMapping("/runs")
    fun runs() = ok(service.runs())

    @GetMapping("/runs/{id}")
    fun detail(@PathVariable id: Long) = ok(service.detail(id))

    @PostMapping("/runs")
    @PreAuthorize("hasAuthority('INTEGRATION_WRITE')")
    fun start(@RequestBody(required = false) request: HemisSyncStartRequest?, @CurrentUser user: User) =
        ok(service.startManual(requireNotNull(user.id), request?.groupId))

    @PostMapping("/runs/{id}/resume")
    @PreAuthorize("hasAuthority('INTEGRATION_WRITE')")
    fun resume(@PathVariable id: Long, @CurrentUser user: User) = ok(service.resume(id, requireNotNull(user.id)))

    @GetMapping("/mappings")
    fun mappings() = ok(service.mappings())

    @PostMapping("/mappings/refresh")
    @PreAuthorize("hasAuthority('INTEGRATION_WRITE')")
    fun refresh(@CurrentUser user: User) = ok(service.refreshMappings(requireNotNull(user.id)))

    @PutMapping("/mappings/{hemisGroupId}")
    @PreAuthorize("hasAuthority('INTEGRATION_WRITE')")
    fun updateMapping(@PathVariable hemisGroupId: Long, @RequestBody request: HemisGroupMappingRequest, @CurrentUser user: User) =
        ok(service.updateMapping(hemisGroupId, request, requireNotNull(user.id)))

    @GetMapping("/local-groups")
    fun localGroups() = ok(service.localGroups())

    @GetMapping("/conflicts")
    fun conflicts(authentication: Authentication) = ok(service.conflicts(canManage(authentication)))

    @PostMapping("/conflicts/{id}/resolve")
    @PreAuthorize("hasAuthority('INTEGRATION_WRITE')")
    fun resolve(@PathVariable id: Long, @RequestBody request: ResolveHemisConflictRequest, @CurrentUser user: User) =
        ok(service.resolveConflict(id, request, requireNotNull(user.id)))

    private fun canManage(authentication: Authentication) = authentication.authorities.any { it.authority == "INTEGRATION_WRITE" }
    private fun <T> ok(data: T): ResponseEntity<ApiResponse<T>> = ResponseEntity.ok(ApiResponse.success(data))
}
