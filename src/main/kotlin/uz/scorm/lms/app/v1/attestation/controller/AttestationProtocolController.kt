package uz.scorm.lms.app.v1.attestation.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.attestation.dto.AttestationProtocolDto
import uz.scorm.lms.app.v1.attestation.service.AttestationProtocolService
import uz.scorm.lms.app.v1.security.CustomUserDetails

@RestController
class AttestationProtocolController(private val service: AttestationProtocolService) {
    @PostMapping("/api/v1/attestation-sessions/{sessionId}/protocol")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun generate(@PathVariable sessionId: Long, authentication: Authentication): ResponseEntity<AttestationProtocolDto> {
        val user = authentication.principal as CustomUserDetails
        return ResponseEntity.status(HttpStatus.CREATED).body(service.generateProtocol(sessionId, user.userId, user.mayManageAll))
    }

    @GetMapping("/api/v1/attestation-sessions/{sessionId}/protocol")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun bySession(@PathVariable sessionId: Long, authentication: Authentication): ResponseEntity<AttestationProtocolDto> {
        val user = authentication.principal as CustomUserDetails
        val protocol = service.getBySession(sessionId, user.userId, user.mayManageAll)
        return protocol?.let { ResponseEntity.ok(it) } ?: ResponseEntity.noContent().build()
    }

    @PostMapping("/api/v1/attestation-protocols/{protocolId}/approve")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun approve(@PathVariable protocolId: Long, authentication: Authentication): ResponseEntity<Void> {
        val user = authentication.principal as CustomUserDetails
        service.approveProtocol(protocolId, user.userId, user.mayManageAll)
        return ResponseEntity.noContent().build()
    }
}
