package uz.scorm.lms.app.v1.support.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.support.dto.*
import uz.scorm.lms.app.v1.support.service.SupportTicketService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/support")
@PreAuthorize("hasAuthority('SUPPORT_READ')")
class SupportTicketController(private val service: SupportTicketService) {
    @GetMapping("/tickets/my")
    fun myTickets(@CurrentUser user: User): ResponseEntity<ApiResponse<List<SupportTicketSummaryDto>>> =
        ResponseEntity.ok(ApiResponse.success(service.myTickets(requireNotNull(user.id))))

    @PostMapping("/tickets")
    fun create(
        @RequestBody request: CreateSupportTicketRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<SupportTicketDetailDto>> =
        ResponseEntity.ok(ApiResponse.success(service.create(request, requireNotNull(user.id))))

    @GetMapping("/tickets/{id}")
    fun detail(
        @PathVariable id: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<SupportTicketDetailDto>> = ResponseEntity.ok(ApiResponse.success(
        service.detail(id, requireNotNull(user.id), isManager(authentication), mayOverride(authentication)),
    ))

    @PostMapping("/tickets/{id}/comments")
    fun comment(
        @PathVariable id: Long,
        @RequestBody request: SupportCommentRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<SupportTicketDetailDto>> = ResponseEntity.ok(ApiResponse.success(
        service.comment(id, request, requireNotNull(user.id), isManager(authentication), mayOverride(authentication)),
    ))

    @PostMapping("/tickets/{id}/cancel")
    fun cancel(
        @PathVariable id: Long,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<SupportTicketDetailDto>> =
        ResponseEntity.ok(ApiResponse.success(service.cancel(id, requireNotNull(user.id))))

    @PostMapping("/tickets/{id}/reopen")
    fun reopen(
        @PathVariable id: Long,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<SupportTicketDetailDto>> =
        ResponseEntity.ok(ApiResponse.success(service.reopen(id, requireNotNull(user.id))))

    @GetMapping("/queue")
    @PreAuthorize("hasAuthority('SUPPORT_WRITE')")
    fun queue(
        @CurrentUser user: User,
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) assigneeId: Long?,
        @RequestParam(defaultValue = "false") breachedOnly: Boolean,
    ): ResponseEntity<ApiResponse<List<SupportTicketSummaryDto>>> = ResponseEntity.ok(ApiResponse.success(
        service.queue(requireNotNull(user.id), status, assigneeId, breachedOnly),
    ))

    @GetMapping("/queue/metrics")
    @PreAuthorize("hasAuthority('SUPPORT_WRITE')")
    fun metrics(@CurrentUser user: User): ResponseEntity<ApiResponse<SupportQueueMetricsDto>> =
        ResponseEntity.ok(ApiResponse.success(service.metrics(requireNotNull(user.id))))

    @GetMapping("/assignees")
    @PreAuthorize("hasAuthority('SUPPORT_WRITE')")
    fun assignees(): ResponseEntity<ApiResponse<List<SupportAssigneeDto>>> =
        ResponseEntity.ok(ApiResponse.success(service.assignees()))

    @PostMapping("/tickets/{id}/assign")
    @PreAuthorize("hasAuthority('SUPPORT_WRITE')")
    fun assign(
        @PathVariable id: Long,
        @RequestBody request: SupportAssignRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<SupportTicketDetailDto>> =
        ResponseEntity.ok(ApiResponse.success(service.assign(id, request, requireNotNull(user.id))))

    @PostMapping("/tickets/{id}/status")
    @PreAuthorize("hasAuthority('SUPPORT_WRITE')")
    fun changeStatus(
        @PathVariable id: Long,
        @RequestBody request: SupportStatusRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<SupportTicketDetailDto>> = ResponseEntity.ok(ApiResponse.success(
        service.changeStatus(id, request, requireNotNull(user.id), mayOverride(authentication)),
    ))

    private fun isManager(authentication: Authentication): Boolean = authentication.authorities.any { it.authority == "SUPPORT_WRITE" }
    private fun mayOverride(authentication: Authentication): Boolean = authentication.authorities.any {
        it.authority == "USER_MANAGE" || it.authority == "SYSTEM_ADMIN"
    }
}
