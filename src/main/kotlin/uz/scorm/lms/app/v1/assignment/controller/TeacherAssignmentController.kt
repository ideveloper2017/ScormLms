package uz.scorm.lms.app.v1.assignment.controller

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
import uz.scorm.lms.app.v1.assignment.dto.AssignmentRequest
import uz.scorm.lms.app.v1.assignment.dto.AssignmentStatusRequest
import uz.scorm.lms.app.v1.assignment.dto.GradeSubmissionRequest
import uz.scorm.lms.app.v1.assignment.dto.TeacherAssignmentDto
import uz.scorm.lms.app.v1.assignment.dto.TeacherSubmissionDto
import uz.scorm.lms.app.v1.assignment.service.AssignmentService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/teachers/me")
@PreAuthorize("hasAuthority('COURSE_WRITE')")
class TeacherAssignmentController(
    private val assignmentService: AssignmentService,
) {
    @GetMapping("/assignments")
    fun assignments(@CurrentUser user: User, authentication: Authentication): List<TeacherAssignmentDto> =
        assignmentService.teacherAssignments(requireNotNull(user.id), mayManageAll(authentication))

    @PostMapping("/assignments")
    fun create(
        @RequestBody request: AssignmentRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<TeacherAssignmentDto> = ResponseEntity.status(HttpStatus.CREATED).body(
        assignmentService.create(request, requireNotNull(user.id), mayManageAll(authentication))
    )

    @PutMapping("/assignments/{assignmentId}")
    fun update(
        @PathVariable assignmentId: Long,
        @RequestBody request: AssignmentRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): TeacherAssignmentDto = assignmentService.update(
        assignmentId,
        request,
        requireNotNull(user.id),
        mayManageAll(authentication),
    )

    @PatchMapping("/assignments/{assignmentId}/status")
    fun status(
        @PathVariable assignmentId: Long,
        @RequestBody request: AssignmentStatusRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): TeacherAssignmentDto = assignmentService.updateStatus(
        assignmentId,
        request.status,
        requireNotNull(user.id),
        mayManageAll(authentication),
    )

    @DeleteMapping("/assignments/{assignmentId}")
    fun delete(
        @PathVariable assignmentId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<Void> {
        assignmentService.deleteAssignment(assignmentId, requireNotNull(user.id), mayManageAll(authentication))
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/submissions")
    fun submissions(
        @RequestParam(required = false) assignmentId: Long?,
        @CurrentUser user: User,
        authentication: Authentication,
    ): List<TeacherSubmissionDto> = assignmentService.teacherSubmissions(
        requireNotNull(user.id),
        mayManageAll(authentication),
        assignmentId,
    )

    @PostMapping("/submissions/{submissionId}/grade")
    fun grade(
        @PathVariable submissionId: Long,
        @RequestBody request: GradeSubmissionRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): TeacherSubmissionDto = assignmentService.grade(
        submissionId,
        request,
        requireNotNull(user.id),
        mayManageAll(authentication),
    )

    private fun mayManageAll(authentication: Authentication): Boolean = authentication.authorities.any {
        it.authority == "USER_MANAGE" || it.authority == "ACADEMIC_WRITE"
    }
}
