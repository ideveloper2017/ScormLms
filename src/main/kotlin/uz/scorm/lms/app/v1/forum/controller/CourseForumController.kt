package uz.scorm.lms.app.v1.forum.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.forum.dto.ForumPostCreateRequest
import uz.scorm.lms.app.v1.forum.dto.ForumPostDto
import uz.scorm.lms.app.v1.forum.dto.ForumPostHideRequest
import uz.scorm.lms.app.v1.forum.dto.ForumPostPageDto
import uz.scorm.lms.app.v1.forum.dto.ForumPostRevisionDto
import uz.scorm.lms.app.v1.forum.dto.ForumPostUpdateRequest
import uz.scorm.lms.app.v1.forum.dto.ForumTopicCreateRequest
import uz.scorm.lms.app.v1.forum.dto.ForumTopicDto
import uz.scorm.lms.app.v1.forum.dto.ForumTopicModerationRequest
import uz.scorm.lms.app.v1.forum.dto.ForumTopicPageDto
import uz.scorm.lms.app.v1.forum.service.CourseForumService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/courses/{courseId}/forum")
@PreAuthorize("hasAuthority('COURSE_READ')")
class CourseForumController(private val service: CourseForumService) {
    @GetMapping("/topics")
    fun topics(
        @PathVariable courseId: Long,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<ForumTopicPageDto>> = ResponseEntity.ok(ApiResponse.success(
        service.topics(courseId, requireNotNull(user.id), mayManageAll(authentication), page, size),
    ))

    @GetMapping("/topics/{topicId}")
    fun posts(
        @PathVariable courseId: Long,
        @PathVariable topicId: Long,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<ForumPostPageDto>> = ResponseEntity.ok(ApiResponse.success(
        service.posts(courseId, topicId, requireNotNull(user.id), mayManageAll(authentication), page, size),
    ))

    @PostMapping("/topics")
    fun createTopic(
        @PathVariable courseId: Long,
        @RequestBody request: ForumTopicCreateRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<ForumTopicDto>> = ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
        "Forum mavzusi yaratildi",
        service.createTopic(courseId, request, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @PostMapping("/topics/{topicId}/posts")
    fun createPost(
        @PathVariable courseId: Long,
        @PathVariable topicId: Long,
        @RequestBody request: ForumPostCreateRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<ForumPostDto>> = ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
        "Forum javobi qo'shildi",
        service.createPost(courseId, topicId, request, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @PutMapping("/topics/{topicId}/posts/{postId}")
    fun editPost(
        @PathVariable courseId: Long,
        @PathVariable topicId: Long,
        @PathVariable postId: Long,
        @RequestBody request: ForumPostUpdateRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<ForumPostDto>> = ResponseEntity.ok(ApiResponse.success(
        "Forum posti yangilandi",
        service.editPost(courseId, topicId, postId, request, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @PatchMapping("/topics/{topicId}/posts/{postId}/hide")
    fun hidePost(
        @PathVariable courseId: Long,
        @PathVariable topicId: Long,
        @PathVariable postId: Long,
        @RequestBody request: ForumPostHideRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<ForumPostDto>> = ResponseEntity.ok(ApiResponse.success(
        "Forum posti yashirildi",
        service.hidePost(courseId, topicId, postId, request, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @PatchMapping("/topics/{topicId}/moderation")
    fun moderateTopic(
        @PathVariable courseId: Long,
        @PathVariable topicId: Long,
        @RequestBody request: ForumTopicModerationRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<ForumTopicDto>> = ResponseEntity.ok(ApiResponse.success(
        service.moderateTopic(courseId, topicId, request, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @GetMapping("/topics/{topicId}/posts/{postId}/revisions")
    fun revisions(
        @PathVariable courseId: Long,
        @PathVariable topicId: Long,
        @PathVariable postId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<List<ForumPostRevisionDto>>> = ResponseEntity.ok(ApiResponse.success(
        service.revisions(courseId, topicId, postId, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    private fun mayManageAll(authentication: Authentication): Boolean = authentication.authorities.any {
        it.authority == "USER_MANAGE" || it.authority == "ACADEMIC_WRITE"
    }
}
