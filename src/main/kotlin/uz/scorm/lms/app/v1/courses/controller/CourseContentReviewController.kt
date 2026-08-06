package uz.scorm.lms.app.v1.courses.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.courses.dto.ContentReviewDecisionRequest
import uz.scorm.lms.app.v1.courses.dto.CourseContentReviewDto
import uz.scorm.lms.app.v1.courses.service.CourseContentReviewService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/content-reviews")
@PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
class CourseContentReviewController(
    private val service: CourseContentReviewService,
) {
    @GetMapping("/pending")
    fun pending(): ResponseEntity<ApiResponse<List<CourseContentReviewDto>>> =
        ResponseEntity.ok(ApiResponse.success(service.pending(true)))

    @PostMapping("/{reviewId}/decision")
    fun decide(
        @PathVariable reviewId: Long,
        @RequestBody request: ContentReviewDecisionRequest,
        @CurrentUser reviewer: User,
    ): ResponseEntity<ApiResponse<CourseContentReviewDto>> = ResponseEntity.ok(ApiResponse.success(
        "Ekspertiza qarori saqlandi",
        service.decide(reviewId, request, requireNotNull(reviewer.id), true),
    ))
}
