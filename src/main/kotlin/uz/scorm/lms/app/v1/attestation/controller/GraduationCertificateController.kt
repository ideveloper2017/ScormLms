package uz.scorm.lms.app.v1.attestation.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.v1.attestation.dto.BulkGenerateCertificatesRequest
import uz.scorm.lms.app.v1.attestation.dto.BatchCertificateResultDto
import uz.scorm.lms.app.v1.attestation.dto.CertificateVerificationResultDto
import uz.scorm.lms.app.v1.attestation.dto.GenerateCertificateRequest
import uz.scorm.lms.app.v1.attestation.dto.GraduationCertificateDetailsDto
import uz.scorm.lms.app.v1.attestation.dto.IssueCertificateRequest
import uz.scorm.lms.app.v1.attestation.dto.StudentCertificateDto
import uz.scorm.lms.app.v1.attestation.dto.VerifyCertificateRequest
import uz.scorm.lms.app.v1.attestation.service.GraduationCertificateService
import uz.scorm.lms.app.v1.security.CustomUserDetails
import org.springframework.security.core.Authentication

@RestController
@RequestMapping("/api/v1/certificates")
class GraduationCertificateController(
    private val certificateService: GraduationCertificateService,
) {

    /**
     * Generate certificate for passing student
     * POST /api/v1/certificates/generate
     */
    @PostMapping("/generate")
    fun generateCertificate(
        @RequestBody request: GenerateCertificateRequest,
        authentication: Authentication,
    ): ResponseEntity<GraduationCertificateDetailsDto> {
        val user = authentication.principal as CustomUserDetails
        val result = certificateService.generateCertificate(request, user.userId, user.mayManageAll)
        return ResponseEntity.status(HttpStatus.CREATED).body(result)
    }

    /**
     * Issue certificate
     * POST /api/v1/certificates/{certificateId}/issue
     */
    @PostMapping("/{certificateId}/issue")
    fun issueCertificate(
        @PathVariable certificateId: Long,
        @RequestBody(required = false) request: IssueCertificateRequest?,
        authentication: Authentication,
    ): ResponseEntity<GraduationCertificateDetailsDto> {
        val user = authentication.principal as CustomUserDetails
        val result = certificateService.issueCertificate(certificateId, user.userId, user.mayManageAll)
        return ResponseEntity.ok(result)
    }

    /**
     * Bulk generate certificates for session
     * POST /api/v1/certificates/bulk-generate
     */
    @PostMapping("/bulk-generate")
    fun bulkGenerateCertificates(
        @RequestBody request: BulkGenerateCertificatesRequest,
        authentication: Authentication,
    ): ResponseEntity<BatchCertificateResultDto> {
        val user = authentication.principal as CustomUserDetails
        val result = certificateService.bulkGenerateCertificates(request, user.userId, user.mayManageAll)
        return ResponseEntity.status(HttpStatus.CREATED).body(result)
    }

    /**
     * Get certificate details
     * GET /api/v1/certificates/{certificateId}
     */
    @GetMapping("/{certificateId}")
    fun getCertificate(
        @PathVariable certificateId: Long,
        authentication: Authentication,
    ): ResponseEntity<GraduationCertificateDetailsDto> {
        val user = authentication.principal as CustomUserDetails
        val result = certificateService.getCertificateDetails(certificateId, user.userId)
        return ResponseEntity.ok(result)
    }

    /**
     * Get student's certificate
     * GET /api/v1/certificates/enrollment/{enrollmentId}
     */
    @GetMapping("/enrollment/{enrollmentId}")
    fun getStudentCertificate(
        @PathVariable enrollmentId: Long,
        authentication: Authentication,
    ): ResponseEntity<StudentCertificateDto?> {
        val user = authentication.principal as CustomUserDetails
        val result = certificateService.getStudentCertificate(enrollmentId, user.userId)
        return if (result != null) {
            ResponseEntity.ok(result)
        } else {
            ResponseEntity.noContent().build()
        }
    }

    /**
     * Verify certificate by number or token
     * POST /api/v1/certificates/verify
     */
    @PostMapping("/verify")
    fun verifyCertificate(
        @RequestBody request: VerifyCertificateRequest,
    ): ResponseEntity<CertificateVerificationResultDto> {
        val result = certificateService.verifyCertificate(request)
        return ResponseEntity.ok(result)
    }

    /**
     * Get certificate statistics (admin only)
     * GET /api/v1/certificates/stats/course/{courseId}
     */
    @GetMapping("/stats/course/{courseId}")
    fun getStatistics(
        @PathVariable courseId: Long,
        authentication: Authentication,
    ): ResponseEntity<uz.scorm.lms.app.v1.attestation.dto.CertificateStatisticsDto> {
        val user = authentication.principal as CustomUserDetails
        val result = certificateService.getCertificateStatistics(courseId, user.userId, user.mayManageAll)
        return ResponseEntity.ok(result)
    }
}