package uz.scorm.lms.app.v1.exam.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.exam.dto.*
import uz.scorm.lms.app.v1.exam.service.ExamAttendanceService
import uz.scorm.lms.app.v1.exam.service.ExamResultService
import uz.scorm.lms.app.v1.exam.service.ExamSessionService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/teachers/me/exams")
@PreAuthorize("hasAuthority('COURSE_WRITE')")
class TeacherExamController(
    private val sessions: ExamSessionService,
    private val attendance: ExamAttendanceService,
    private val results: ExamResultService,
) {
    @GetMapping fun list(@CurrentUser user: User, authentication: Authentication) = sessions.getTeacherSessions(user.id!!, mayManageAll(authentication))
    @PostMapping fun create(@RequestBody request: CreateExamSessionRequest, @CurrentUser user: User, authentication: Authentication) =
        ResponseEntity.status(HttpStatus.CREATED).body(sessions.createExamSession(request, user.id!!, mayManageAll(authentication)))
    @GetMapping("/{id}") fun detail(@PathVariable id: Long, @CurrentUser user: User, authentication: Authentication) = sessions.getExamSession(id, user.id!!, mayManageAll(authentication))
    @PutMapping("/{id}") fun update(@PathVariable id: Long, @RequestBody request: UpdateExamSessionRequest, @CurrentUser user: User, authentication: Authentication) = sessions.updateExamSession(id, request, user.id!!, mayManageAll(authentication))
    @PostMapping("/{id}/publish") fun publish(@PathVariable id: Long, @CurrentUser user: User, authentication: Authentication) = sessions.publishExamSession(id, null, user.id!!, mayManageAll(authentication))
    @PostMapping("/{id}/start") fun start(@PathVariable id: Long, @CurrentUser user: User, authentication: Authentication) = sessions.startExamSession(id, user.id!!, mayManageAll(authentication))
    @PostMapping("/{id}/complete") fun complete(@PathVariable id: Long, @CurrentUser user: User, authentication: Authentication) = sessions.completeExamSession(id, null, user.id!!, mayManageAll(authentication))
    @DeleteMapping("/{id}") fun delete(@PathVariable id: Long, @CurrentUser user: User, authentication: Authentication): ResponseEntity<Void> {
        sessions.deleteExamSession(id, user.id!!, mayManageAll(authentication)); return ResponseEntity.noContent().build()
    }

    @GetMapping("/{id}/attendance") fun attendance(@PathVariable id: Long, @CurrentUser user: User, authentication: Authentication) = attendance.sheet(id, user.id!!, mayManageAll(authentication))
    @PutMapping("/{id}/attendance/{enrollmentId}") fun attendance(
        @PathVariable id: Long, @PathVariable enrollmentId: Long, @RequestBody request: RecordAttendanceRequest,
        @CurrentUser user: User, authentication: Authentication,
    ) = attendance.record(id, enrollmentId, request, user.id!!, mayManageAll(authentication))
    @PostMapping("/{id}/attendance/bulk") fun bulkAttendance(@PathVariable id: Long, @RequestBody request: BulkRecordAttendanceRequest, @CurrentUser user: User, authentication: Authentication) = attendance.recordBulk(id, request, user.id!!, mayManageAll(authentication))

    @GetMapping("/{id}/results") fun results(@PathVariable id: Long, @CurrentUser user: User, authentication: Authentication) = results.teacherResults(id, user.id!!, mayManageAll(authentication))
    @PutMapping("/{id}/results/{enrollmentId}") fun result(
        @PathVariable id: Long, @PathVariable enrollmentId: Long, @RequestBody request: RecordExamResultRequest,
        @CurrentUser user: User, authentication: Authentication,
    ) = results.record(id, enrollmentId, request, user.id!!, mayManageAll(authentication))
    @PostMapping("/{id}/results/bulk") fun bulkResults(@PathVariable id: Long, @RequestBody request: BulkRecordExamResultRequest, @CurrentUser user: User, authentication: Authentication) = results.recordBulk(id, request, user.id!!, mayManageAll(authentication))
    @GetMapping("/{id}/results/statistics") fun statistics(@PathVariable id: Long, @CurrentUser user: User, authentication: Authentication) = results.statistics(id, user.id!!, mayManageAll(authentication))
    @GetMapping("/{id}/appeals") fun appeals(@PathVariable id: Long, @CurrentUser user: User, authentication: Authentication) = results.sessionAppeals(id, user.id!!, mayManageAll(authentication))
    @PostMapping("/appeals/{appealId}/review") fun review(@PathVariable appealId: Long, @RequestBody request: ReviewExamAppealRequest, @CurrentUser user: User, authentication: Authentication) = results.reviewAppeal(appealId, request, user.id!!, mayManageAll(authentication))

    private fun mayManageAll(authentication: Authentication) = authentication.authorities.any { it.authority in setOf("USER_MANAGE", "ACADEMIC_WRITE") }
}
