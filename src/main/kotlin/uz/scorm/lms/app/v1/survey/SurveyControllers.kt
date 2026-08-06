package uz.scorm.lms.app.v1.survey

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/admin/surveys")
@PreAuthorize("hasAnyAuthority('ACADEMIC_READ', 'STAT_READ')")
class AdminSurveyController(private val service: SurveyService) {
    @GetMapping
    fun list() = ResponseEntity.ok(ApiResponse.success(service.listAdmin()))

    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(@RequestBody request: CreateSurveyRequest, @CurrentUser user: User) =
        ResponseEntity.ok(ApiResponse.success(service.create(request, requireNotNull(user.id))))

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun publish(@PathVariable id: Long, @CurrentUser user: User) =
        ResponseEntity.ok(ApiResponse.success(service.publish(id, requireNotNull(user.id))))

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun close(@PathVariable id: Long, @CurrentUser user: User) =
        ResponseEntity.ok(ApiResponse.success(service.close(id, requireNotNull(user.id))))

    @GetMapping("/{id}/results")
    fun results(@PathVariable id: Long) = ResponseEntity.ok(ApiResponse.success(service.results(id)))
}

@RestController
@RequestMapping("/api/v1/surveys")
@PreAuthorize("hasAnyRole('STUDENT', 'TEACHER')")
class SurveyParticipantController(private val service: SurveyService) {
    @GetMapping
    fun available(@CurrentUser user: User, authentication: Authentication) =
        ResponseEntity.ok(ApiResponse.success(service.available(requireNotNull(user.id), respondentRole(authentication))))

    @PostMapping("/{id}/responses")
    fun submit(
        @PathVariable id: Long,
        @RequestBody request: SubmitSurveyResponseRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ) = ResponseEntity.ok(ApiResponse.success(service.submit(id, request, requireNotNull(user.id), respondentRole(authentication))))

    private fun respondentRole(authentication: Authentication): SurveyRespondentRole = when {
        authentication.authorities.any { it.authority == "ROLE_STUDENT" } -> SurveyRespondentRole.STUDENT
        authentication.authorities.any { it.authority == "ROLE_TEACHER" } -> SurveyRespondentRole.TEACHER
        else -> throw IllegalArgumentException("So'rov respondent roli aniqlanmadi")
    }
}
