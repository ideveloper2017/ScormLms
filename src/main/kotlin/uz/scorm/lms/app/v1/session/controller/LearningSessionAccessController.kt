package uz.scorm.lms.app.v1.session.controller

import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.session.dto.LearningSessionAccessRequest
import uz.scorm.lms.app.v1.session.dto.LearningSessionAccessResponse
import uz.scorm.lms.app.v1.session.service.LearningSessionService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/learning-sessions")
class LearningSessionAccessController(
    private val service: LearningSessionService,
) {
    @PostMapping("/{sessionId}/access")
    fun access(
        @PathVariable sessionId: Long,
        @RequestBody request: LearningSessionAccessRequest,
        @CurrentUser user: User,
    ): ApiResponse<LearningSessionAccessResponse> = ApiResponse.success(
        service.access(sessionId, requireNotNull(user.id), request.type),
    )
}
