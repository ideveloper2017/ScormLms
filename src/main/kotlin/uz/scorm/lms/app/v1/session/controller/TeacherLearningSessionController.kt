package uz.scorm.lms.app.v1.session.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.session.dto.LearningSessionRequest
import uz.scorm.lms.app.v1.session.dto.LearningSessionStatusRequest
import uz.scorm.lms.app.v1.session.dto.TeacherLearningSessionDto
import uz.scorm.lms.app.v1.session.service.LearningSessionService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/teachers/me/sessions")
@PreAuthorize("hasAuthority('COURSE_WRITE')")
class TeacherLearningSessionController(
    private val service: LearningSessionService,
) {
    @GetMapping
    fun list(
        @RequestParam(required = false) courseId: Long?,
        @CurrentUser user: User,
        authentication: Authentication,
    ): List<TeacherLearningSessionDto> = service.teacherSessions(
        requireNotNull(user.id), mayManageAll(authentication), courseId,
    )

    @PostMapping
    fun create(
        @RequestBody request: LearningSessionRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<TeacherLearningSessionDto> = ResponseEntity.status(HttpStatus.CREATED).body(
        service.create(request, requireNotNull(user.id), mayManageAll(authentication)),
    )

    @PutMapping("/{sessionId}")
    fun update(
        @PathVariable sessionId: Long,
        @RequestBody request: LearningSessionRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): TeacherLearningSessionDto = service.update(
        sessionId, request, requireNotNull(user.id), mayManageAll(authentication),
    )

    @PatchMapping("/{sessionId}/status")
    fun status(
        @PathVariable sessionId: Long,
        @RequestBody request: LearningSessionStatusRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): TeacherLearningSessionDto = service.changeStatus(
        sessionId, request.status, requireNotNull(user.id), mayManageAll(authentication),
    )

    @DeleteMapping("/{sessionId}")
    fun delete(
        @PathVariable sessionId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<Void> {
        service.delete(sessionId, requireNotNull(user.id), mayManageAll(authentication))
        return ResponseEntity.noContent().build()
    }

    private fun mayManageAll(authentication: Authentication): Boolean = authentication.authorities.any {
        it.authority == "USER_MANAGE" || it.authority == "ACADEMIC_WRITE"
    }
}
