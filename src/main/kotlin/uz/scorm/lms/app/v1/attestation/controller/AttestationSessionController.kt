package uz.scorm.lms.app.v1.attestation.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.v1.attestation.dto.AddCommissionMemberRequest
import uz.scorm.lms.app.v1.attestation.dto.CompleteAttestationSessionRequest
import uz.scorm.lms.app.v1.attestation.dto.CreateAttestationSessionRequest
import uz.scorm.lms.app.v1.attestation.dto.PublishAttestationSessionRequest
import uz.scorm.lms.app.v1.attestation.dto.RemoveCommissionMemberRequest
import uz.scorm.lms.app.v1.attestation.dto.TeacherAttestationSessionDto
import uz.scorm.lms.app.v1.attestation.dto.UpdateAttestationSessionRequest
import uz.scorm.lms.app.v1.attestation.service.AttestationSessionService
import uz.scorm.lms.app.v1.security.CustomUserDetails
import org.springframework.security.core.Authentication

@RestController
@RequestMapping("/api/v1/attestation-sessions")
class AttestationSessionController(
    private val sessionService: AttestationSessionService,
) {

    /**
     * Create new attestation session
     * POST /api/v1/attestation-sessions
     */
    @PostMapping
    fun createSession(
        @RequestBody request: CreateAttestationSessionRequest,
        authentication: Authentication,
    ): ResponseEntity<TeacherAttestationSessionDto> {
        val user = authentication.principal as CustomUserDetails
        val result = sessionService.createSession(request, user.userId, user.mayManageAll)
        return ResponseEntity.status(HttpStatus.CREATED).body(result)
    }

    /**
     * Get attestation session details
     * GET /api/v1/attestation-sessions/{sessionId}
     */
    @GetMapping("/{sessionId}")
    fun getSession(
        @PathVariable sessionId: Long,
        authentication: Authentication,
    ): ResponseEntity<uz.scorm.lms.app.v1.attestation.dto.AttestationSessionDetailDto> {
        val user = authentication.principal as CustomUserDetails
        val result = sessionService.getSessionDetails(sessionId, user.userId, user.mayManageAll)
        return ResponseEntity.ok(result)
    }

    /**
     * List teacher's attestation sessions
     * GET /api/v1/attestation-sessions
     */
    @GetMapping
    fun listSessions(
        authentication: Authentication,
    ): ResponseEntity<List<TeacherAttestationSessionDto>> {
        val user = authentication.principal as CustomUserDetails
        val result = sessionService.getTeacherSessions(user.userId, user.mayManageAll)
        return ResponseEntity.ok(result)
    }

    /**
     * Update attestation session
     * PUT /api/v1/attestation-sessions/{sessionId}
     */
    @PutMapping("/{sessionId}")
    fun updateSession(
        @PathVariable sessionId: Long,
        @RequestBody request: UpdateAttestationSessionRequest,
        authentication: Authentication,
    ): ResponseEntity<TeacherAttestationSessionDto> {
        val user = authentication.principal as CustomUserDetails
        val result = sessionService.updateSession(sessionId, request, user.userId, user.mayManageAll)
        return ResponseEntity.ok(result)
    }

    /**
     * Publish attestation session
     * POST /api/v1/attestation-sessions/{sessionId}/publish
     */
    @PostMapping("/{sessionId}/publish")
    fun publishSession(
        @PathVariable sessionId: Long,
        @RequestBody(required = false) request: PublishAttestationSessionRequest?,
        authentication: Authentication,
    ): ResponseEntity<TeacherAttestationSessionDto> {
        val user = authentication.principal as CustomUserDetails
        val result = sessionService.publishSession(sessionId, request, user.userId, user.mayManageAll)
        return ResponseEntity.ok(result)
    }

    /**
     * Complete attestation session
     * POST /api/v1/attestation-sessions/{sessionId}/complete
     */
    @PostMapping("/{sessionId}/complete")
    fun completeSession(
        @PathVariable sessionId: Long,
        @RequestBody(required = false) request: CompleteAttestationSessionRequest?,
        authentication: Authentication,
    ): ResponseEntity<TeacherAttestationSessionDto> {
        val user = authentication.principal as CustomUserDetails
        val result = sessionService.completeSession(sessionId, request, user.userId, user.mayManageAll)
        return ResponseEntity.ok(result)
    }

    /**
     * Add commission member
     * POST /api/v1/attestation-sessions/{sessionId}/members
     */
    @PostMapping("/{sessionId}/members")
    fun addMember(
        @PathVariable sessionId: Long,
        @RequestBody request: AddCommissionMemberRequest,
        authentication: Authentication,
    ): ResponseEntity<Void> {
        val user = authentication.principal as CustomUserDetails
        sessionService.addCommissionMember(sessionId, request, user.userId, user.mayManageAll)
        return ResponseEntity.status(HttpStatus.CREATED).build()
    }

    /**
     * Remove commission member
     * DELETE /api/v1/attestation-sessions/{sessionId}/members/{memberId}
     */
    @DeleteMapping("/{sessionId}/members/{memberId}")
    fun removeMember(
        @PathVariable sessionId: Long,
        @PathVariable memberId: Long,
        authentication: Authentication,
    ): ResponseEntity<Void> {
        val user = authentication.principal as CustomUserDetails
        sessionService.removeCommissionMember(sessionId, RemoveCommissionMemberRequest(memberId), user.userId, user.mayManageAll)
        return ResponseEntity.noContent().build()
    }

    /**
     * Delete attestation session
     * DELETE /api/v1/attestation-sessions/{sessionId}
     */
    @DeleteMapping("/{sessionId}")
    fun deleteSession(
        @PathVariable sessionId: Long,
        authentication: Authentication,
    ): ResponseEntity<Void> {
        val user = authentication.principal as CustomUserDetails
        sessionService.deleteSession(sessionId, user.userId, user.mayManageAll)
        return ResponseEntity.noContent().build()
    }
}