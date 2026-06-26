package uz.scorm.lms.app.v1.notification.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.notification.dto.CreateNotificationRequest
import uz.scorm.lms.app.v1.notification.dto.NotificationCountDto
import uz.scorm.lms.app.v1.notification.dto.NotificationDto
import uz.scorm.lms.app.v1.notification.service.NotificationService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1")
@PreAuthorize("isAuthenticated()")
class NotificationController(private val notificationService: NotificationService) {

    @GetMapping("/students/me/notifications")
    fun getMyNotifications(
        @CurrentUser user: User,
        @RequestParam(required = false) page: Int?,
        @RequestParam(required = false) size: Int?,
        @RequestParam(required = false) read: Boolean?,
    ): ResponseEntity<ApiResponse<List<NotificationDto>>> =
        ResponseEntity.ok(ApiResponse.success(notificationService.getForUser(user.id!!)))

    @GetMapping("/students/me/notifications/unread/count")
    fun getUnreadCount(
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<NotificationCountDto>> =
        ResponseEntity.ok(ApiResponse.success(notificationService.getUnreadCount(user.id!!)))

    @PostMapping("/students/me/notifications/read-all")
    fun markAllRead(
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<String>> {
        notificationService.markAllAsRead(user.id!!)
        return ResponseEntity.ok(ApiResponse.success("Barcha bildirishnomalar o'qildi deb belgilandi"))
    }

    @PostMapping("/notifications/{id}/read")
    fun markAsRead(
        @PathVariable id: String,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<Void>> {
        notificationService.markAsRead(id, user.id!!)
        return ResponseEntity.ok(ApiResponse.success("O'qildi", null))
    }

    @DeleteMapping("/notifications/{id}")
    fun deleteNotification(
        @PathVariable id: String,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<Void>> {
        notificationService.delete(id, user.id!!)
        return ResponseEntity.ok(ApiResponse.success("O'chirildi", null))
    }

    @PostMapping("/notifications")
    @PreAuthorize("hasAnyAuthority('USER_MANAGE', 'SYSTEM_ADMIN')")
    fun createNotification(
        @RequestBody req: CreateNotificationRequest,
    ): ResponseEntity<ApiResponse<NotificationDto>> =
        ResponseEntity.ok(ApiResponse.success(notificationService.create(req)))
}
