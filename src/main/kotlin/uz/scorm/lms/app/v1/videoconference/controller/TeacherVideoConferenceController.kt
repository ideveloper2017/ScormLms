package uz.scorm.lms.app.v1.videoconference.controller

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.videoconference.dto.VideoConferenceMeetingDto
import uz.scorm.lms.app.v1.videoconference.service.VideoConferenceService

@RestController
@RequestMapping("/api/v1/teachers/me/sessions/{sessionId}/videoconference")
@PreAuthorize("hasAuthority('COURSE_WRITE')")
class TeacherVideoConferenceController(private val service: VideoConferenceService) {
    @GetMapping
    fun get(@PathVariable sessionId: Long, @CurrentUser user: User, authentication: Authentication): VideoConferenceMeetingDto =
        service.get(sessionId, requireNotNull(user.id), mayManageAll(authentication))

    @PostMapping
    fun provision(@PathVariable sessionId: Long, @CurrentUser user: User, authentication: Authentication): VideoConferenceMeetingDto =
        service.provision(sessionId, requireNotNull(user.id), mayManageAll(authentication))

    @DeleteMapping
    fun cancel(@PathVariable sessionId: Long, @CurrentUser user: User, authentication: Authentication): VideoConferenceMeetingDto =
        service.cancel(sessionId, requireNotNull(user.id), mayManageAll(authentication))

    private fun mayManageAll(authentication: Authentication) = authentication.authorities.any {
        it.authority == "USER_MANAGE" || it.authority == "ACADEMIC_WRITE"
    }
}
