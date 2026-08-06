package uz.scorm.lms.app.v1.quiz.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.quiz.dto.CreateProctoringAppealRequest
import uz.scorm.lms.app.v1.quiz.dto.ProctoringAppealContextDto
import uz.scorm.lms.app.v1.quiz.dto.ProctoringAppealDto
import uz.scorm.lms.app.v1.quiz.service.ProctoringAppealService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/tests/{quizId}/attempts/{attemptId}/proctoring/appeal")
class StudentProctoringAppealController(
    private val service: ProctoringAppealService,
) {
    @GetMapping
    fun context(
        @PathVariable quizId: Long,
        @PathVariable attemptId: Long,
        @CurrentUser user: User,
    ): ApiResponse<ProctoringAppealContextDto> = ApiResponse.success(
        service.context(quizId, attemptId, requireNotNull(user.id))
    )

    @PostMapping
    fun create(
        @PathVariable quizId: Long,
        @PathVariable attemptId: Long,
        @RequestBody request: CreateProctoringAppealRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<ProctoringAppealDto>> = ResponseEntity.status(HttpStatus.CREATED).body(
        ApiResponse.success(service.create(quizId, attemptId, requireNotNull(user.id), request))
    )
}
