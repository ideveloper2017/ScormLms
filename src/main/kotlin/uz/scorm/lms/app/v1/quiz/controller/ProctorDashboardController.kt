package uz.scorm.lms.app.v1.quiz.controller

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.quiz.dto.ProctorActiveExamDto
import uz.scorm.lms.app.v1.quiz.dto.ProctorAttemptEvidenceDto
import uz.scorm.lms.app.v1.quiz.dto.ProctorSessionSummaryDto
import uz.scorm.lms.app.v1.quiz.dto.ProctorStatsDto
import uz.scorm.lms.app.v1.quiz.dto.ProctorViolationDto
import uz.scorm.lms.app.v1.quiz.dto.ProctoringAppealDto
import uz.scorm.lms.app.v1.quiz.dto.ReviewProctoringAppealRequest
import uz.scorm.lms.app.v1.quiz.service.ProctorDashboardService
import uz.scorm.lms.app.v1.quiz.service.ProctoringAppealService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/proctors/me")
@PreAuthorize("hasAnyAuthority('EXAM_PROCTOR', 'COURSE_WRITE')")
class ProctorDashboardController(
    private val service: ProctorDashboardService,
    private val appealService: ProctoringAppealService,
) {
    @GetMapping("/stats")
    fun stats(@CurrentUser user: User, authentication: Authentication): ApiResponse<ProctorStatsDto> =
        ApiResponse.success(service.stats(requireNotNull(user.id), mayManageAll(authentication)))

    @GetMapping("/active-exams")
    fun activeExams(@CurrentUser user: User, authentication: Authentication): ApiResponse<List<ProctorActiveExamDto>> =
        ApiResponse.success(service.activeExams(requireNotNull(user.id), mayManageAll(authentication)))

    @GetMapping("/sessions")
    fun sessions(@CurrentUser user: User, authentication: Authentication): ApiResponse<List<ProctorSessionSummaryDto>> =
        ApiResponse.success(service.sessions(requireNotNull(user.id), mayManageAll(authentication)))

    @GetMapping("/violations")
    fun violations(@CurrentUser user: User, authentication: Authentication): ApiResponse<List<ProctorViolationDto>> =
        ApiResponse.success(service.violations(requireNotNull(user.id), mayManageAll(authentication)))

    @GetMapping("/sessions/{attemptId}")
    fun evidence(
        @PathVariable attemptId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ApiResponse<ProctorAttemptEvidenceDto> = ApiResponse.success(
        service.evidence(attemptId, requireNotNull(user.id), mayManageAll(authentication))
    )

    @GetMapping("/appeals")
    fun appeals(
        @CurrentUser user: User,
        authentication: Authentication,
    ): ApiResponse<List<ProctoringAppealDto>> = ApiResponse.success(
        appealService.reviewerAppeals(requireNotNull(user.id), mayManageAll(authentication))
    )

    @PostMapping("/appeals/{appealId}/review")
    fun reviewAppeal(
        @PathVariable appealId: Long,
        @RequestBody request: ReviewProctoringAppealRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ApiResponse<ProctoringAppealDto> = ApiResponse.success(
        appealService.review(appealId, requireNotNull(user.id), mayManageAll(authentication), request)
    )

    private fun mayManageAll(authentication: Authentication): Boolean = authentication.authorities.any {
        it.authority in setOf("USER_MANAGE", "ACADEMIC_WRITE")
    }
}
