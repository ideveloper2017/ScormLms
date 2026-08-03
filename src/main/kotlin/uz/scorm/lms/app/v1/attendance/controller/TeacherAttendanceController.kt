package uz.scorm.lms.app.v1.attendance.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.attendance.dto.AttendanceSessionRequest
import uz.scorm.lms.app.v1.attendance.dto.TeacherAttendanceSessionDto
import uz.scorm.lms.app.v1.attendance.service.AttendanceService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/teachers/me/attendance")
@PreAuthorize("hasAuthority('COURSE_WRITE')")
class TeacherAttendanceController(
    private val attendanceService: AttendanceService,
) {
    @GetMapping
    fun sessions(
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<List<TeacherAttendanceSessionDto>> = ResponseEntity.ok(
        attendanceService.teacherSessions(requireNotNull(user.id), mayManageAll(authentication))
    )

    @PostMapping("/sessions")
    fun create(
        @RequestBody request: AttendanceSessionRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<TeacherAttendanceSessionDto> = ResponseEntity.status(HttpStatus.CREATED).body(
        attendanceService.createSession(request, requireNotNull(user.id), mayManageAll(authentication))
    )

    @DeleteMapping("/sessions/{sessionId}")
    fun delete(
        @PathVariable sessionId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<Void> {
        attendanceService.deleteSession(sessionId, requireNotNull(user.id), mayManageAll(authentication))
        return ResponseEntity.noContent().build()
    }

    private fun mayManageAll(authentication: Authentication): Boolean = authentication.authorities.any {
        it.authority == "USER_MANAGE" || it.authority == "ACADEMIC_WRITE"
    }
}
