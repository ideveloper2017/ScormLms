package uz.scorm.lms.app.v1.chat.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.chat.dto.ChatContactDto
import uz.scorm.lms.app.v1.chat.dto.ChatConversationDto
import uz.scorm.lms.app.v1.chat.dto.ChatMessageCreateRequest
import uz.scorm.lms.app.v1.chat.dto.ChatMessageDto
import uz.scorm.lms.app.v1.chat.dto.ChatMessageHideRequest
import uz.scorm.lms.app.v1.chat.dto.ChatMessagePageDto
import uz.scorm.lms.app.v1.chat.dto.ChatReadRequest
import uz.scorm.lms.app.v1.chat.dto.DirectConversationRequest
import uz.scorm.lms.app.v1.chat.dto.GroupConversationRequest
import uz.scorm.lms.app.v1.chat.dto.GroupMembersRequest
import uz.scorm.lms.app.v1.chat.service.ChatService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/chat")
@PreAuthorize("hasAuthority('COURSE_READ')")
class ChatController(private val service: ChatService) {
    @GetMapping("/contacts")
    fun contacts(
        @RequestParam(required = false) q: String?,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<List<ChatContactDto>>> = ResponseEntity.ok(ApiResponse.success(
        service.contacts(requireNotNull(user.id), mayManageAll(authentication), q),
    ))

    @GetMapping("/conversations")
    fun conversations(@CurrentUser user: User): ResponseEntity<ApiResponse<List<ChatConversationDto>>> =
        ResponseEntity.ok(ApiResponse.success(service.conversations(requireNotNull(user.id))))

    @PostMapping("/conversations/direct")
    fun direct(
        @RequestBody request: DirectConversationRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<ChatConversationDto>> = ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
        service.direct(request, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @PostMapping("/conversations/groups")
    fun group(
        @RequestBody request: GroupConversationRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<ChatConversationDto>> = ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
        service.group(request, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @PatchMapping("/conversations/{conversationId}/members")
    fun updateMembers(
        @PathVariable conversationId: Long,
        @RequestBody request: GroupMembersRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<ChatConversationDto>> = ResponseEntity.ok(ApiResponse.success(
        service.updateGroupMembers(conversationId, request, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @GetMapping("/conversations/{conversationId}/messages")
    fun messages(
        @PathVariable conversationId: Long,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<ChatMessagePageDto>> = ResponseEntity.ok(ApiResponse.success(
        service.messages(conversationId, requireNotNull(user.id), page, size),
    ))

    @PostMapping("/conversations/{conversationId}/messages")
    fun send(
        @PathVariable conversationId: Long,
        @RequestBody request: ChatMessageCreateRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<ChatMessageDto>> = ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
        service.send(conversationId, request, requireNotNull(user.id)),
    ))

    @PostMapping("/conversations/{conversationId}/read")
    fun markRead(
        @PathVariable conversationId: Long,
        @RequestBody request: ChatReadRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<ChatConversationDto>> = ResponseEntity.ok(ApiResponse.success(
        service.markRead(conversationId, request, requireNotNull(user.id)),
    ))

    @PatchMapping("/conversations/{conversationId}/messages/{messageId}/hide")
    fun hideMessage(
        @PathVariable conversationId: Long,
        @PathVariable messageId: Long,
        @RequestBody request: ChatMessageHideRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<ChatMessageDto>> = ResponseEntity.ok(ApiResponse.success(
        service.hideMessage(conversationId, messageId, request, requireNotNull(user.id)),
    ))

    @PatchMapping("/conversations/{conversationId}/archive")
    fun archive(
        @PathVariable conversationId: Long,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<ChatConversationDto>> = ResponseEntity.ok(ApiResponse.success(
        service.archive(conversationId, requireNotNull(user.id)),
    ))

    private fun mayManageAll(authentication: Authentication): Boolean = authentication.authorities.any {
        it.authority == "USER_MANAGE" || it.authority == "ACADEMIC_WRITE"
    }
}
