package uz.scorm.lms.app.v1.attestation.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.v1.attestation.dto.CancelDefenseRequest
import uz.scorm.lms.app.v1.attestation.dto.DefenseGradeDto
import uz.scorm.lms.app.v1.attestation.dto.RecordDefenseRequest
import uz.scorm.lms.app.v1.attestation.dto.RescheduleDefenseRequest
import uz.scorm.lms.app.v1.attestation.dto.ScheduleDefenseRequest
import uz.scorm.lms.app.v1.attestation.dto.StudentDefenseDetailsDto
import uz.scorm.lms.app.v1.attestation.dto.StudentDefenseHistoryDto
import uz.scorm.lms.app.v1.attestation.dto.SubmitGradeRequest
import uz.scorm.lms.app.v1.attestation.service.StudentDefenseService
import uz.scorm.lms.app.v1.security.CustomUserDetails
import org.springframework.security.core.Authentication

@RestController
@RequestMapping("/api/v1/defenses")
class StudentDefenseController(
    private val defenseService: StudentDefenseService,
) {

    /**
     * Schedule defense
     * POST /api/v1/defenses/{defenseId}/schedule
     */
    @PostMapping("/{defenseId}/schedule")
    fun scheduleDefense(
        @PathVariable defenseId: Long,
        @RequestBody request: ScheduleDefenseRequest,
        authentication: Authentication,
    ): ResponseEntity<StudentDefenseDetailsDto> {
        val user = authentication.principal as CustomUserDetails
        val result = defenseService.scheduleDefense(defenseId, request, user.userId)
        return ResponseEntity.ok(result)
    }

    /**
     * Record defense (teacher only)
     * POST /api/v1/defenses/{defenseId}/record
     */
    @PostMapping("/{defenseId}/record")
    fun recordDefense(
        @PathVariable defenseId: Long,
        @RequestBody request: RecordDefenseRequest,
        authentication: Authentication,
    ): ResponseEntity<uz.scorm.lms.app.v1.attestation.dto.TeacherStudentDefenseDto> {
        val user = authentication.principal as CustomUserDetails
        val result = defenseService.recordDefense(defenseId, request, user.userId, user.mayManageAll)
        return ResponseEntity.ok(result)
    }

    /**
     * Submit grade for defense (commission member only)
     * POST /api/v1/defenses/{defenseId}/grade
     */
    @PostMapping("/{defenseId}/grade")
    fun submitGrade(
        @PathVariable defenseId: Long,
        @RequestBody request: SubmitGradeRequest,
        authentication: Authentication,
    ): ResponseEntity<DefenseGradeDto> {
        val user = authentication.principal as CustomUserDetails
        val result = defenseService.submitGrade(defenseId, user.userId, request, user.mayManageAll)
        return ResponseEntity.status(HttpStatus.CREATED).body(result)
    }

    /**
     * Cancel defense (teacher only)
     * POST /api/v1/defenses/{defenseId}/cancel
     */
    @PostMapping("/{defenseId}/cancel")
    fun cancelDefense(
        @PathVariable defenseId: Long,
        @RequestBody request: CancelDefenseRequest,
        authentication: Authentication,
    ): ResponseEntity<StudentDefenseDetailsDto> {
        val user = authentication.principal as CustomUserDetails
        val result = defenseService.cancelDefense(defenseId, request, user.userId, user.mayManageAll)
        return ResponseEntity.ok(result)
    }

    /**
     * Reschedule defense (student only)
     * POST /api/v1/defenses/{defenseId}/reschedule
     */
    @PostMapping("/{defenseId}/reschedule")
    fun rescheduleDefense(
        @PathVariable defenseId: Long,
        @RequestBody request: RescheduleDefenseRequest,
        authentication: Authentication,
    ): ResponseEntity<StudentDefenseDetailsDto> {
        val user = authentication.principal as CustomUserDetails
        val result = defenseService.rescheduleDefense(defenseId, request, user.userId)
        return ResponseEntity.ok(result)
    }

    /**
     * Get defense details
     * GET /api/v1/defenses/{defenseId}
     */
    @GetMapping("/{defenseId}")
    fun getDefense(
        @PathVariable defenseId: Long,
        authentication: Authentication,
    ): ResponseEntity<Any> {
        val user = authentication.principal as CustomUserDetails
        val isTeacher = user.mayManageAll // Simplified check; in production, check role properly
        val result = defenseService.getDefenseDetails(defenseId, user.userId, isTeacher)
        return ResponseEntity.ok(result)
    }

    /**
     * Get student's defense history
     * GET /api/v1/defenses/enrollment/{enrollmentId}/history
     */
    @GetMapping("/enrollment/{enrollmentId}/history")
    fun getDefenseHistory(
        @PathVariable enrollmentId: Long,
        authentication: Authentication,
    ): ResponseEntity<List<StudentDefenseHistoryDto>> {
        val user = authentication.principal as CustomUserDetails
        val result = defenseService.getStudentDefenseHistory(enrollmentId, user.userId)
        return ResponseEntity.ok(result)
    }
}