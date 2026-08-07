package uz.scorm.lms.app.v1.announcement.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.announcement.dto.*
import uz.scorm.lms.app.v1.announcement.service.AnnouncementService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/announcements")
@PreAuthorize("hasAuthority('COURSE_READ')")
class AnnouncementController(private val announcementService: AnnouncementService) {
    @GetMapping("/inbox")
    fun inbox(@CurrentUser user: User): ResponseEntity<ApiResponse<List<AnnouncementInboxDto>>> =
        ResponseEntity.ok(ApiResponse.success(announcementService.inbox(requireNotNull(user.id))))

    @PostMapping("/{id}/read")
    fun markRead(
        @PathVariable id: Long,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<AnnouncementInboxDto>> =
        ResponseEntity.ok(ApiResponse.success(announcementService.markRead(id, requireNotNull(user.id))))

    @GetMapping("/manage/options")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun options(
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<AnnouncementManageOptionsDto>> = ResponseEntity.ok(ApiResponse.success(
        announcementService.options(requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @GetMapping("/manage")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun manage(
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<List<AnnouncementDto>>> = ResponseEntity.ok(ApiResponse.success(
        announcementService.manage(requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @PostMapping
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun create(
        @RequestBody request: AnnouncementUpsertRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<AnnouncementDto>> = ResponseEntity.ok(ApiResponse.success(
        announcementService.create(request, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: AnnouncementUpsertRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<AnnouncementDto>> = ResponseEntity.ok(ApiResponse.success(
        announcementService.update(id, request, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun publish(
        @PathVariable id: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<AnnouncementDto>> = ResponseEntity.ok(ApiResponse.success(
        announcementService.publish(id, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun archive(
        @PathVariable id: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<AnnouncementDto>> = ResponseEntity.ok(ApiResponse.success(
        announcementService.archive(id, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @GetMapping("/{id}/deliveries")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun deliveries(
        @PathVariable id: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<AnnouncementDeliveryReportDto>> = ResponseEntity.ok(ApiResponse.success(
        announcementService.deliveryReport(id, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @PostMapping("/{id}/deliveries/retry")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun retry(
        @PathVariable id: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<AnnouncementRetryResultDto>> = ResponseEntity.ok(ApiResponse.success(
        announcementService.retry(id, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    private fun mayManageAll(authentication: Authentication): Boolean = authentication.authorities.any {
        it.authority == "USER_MANAGE" || it.authority == "ACADEMIC_WRITE" || it.authority == "SYSTEM_ADMIN"
    }
}
