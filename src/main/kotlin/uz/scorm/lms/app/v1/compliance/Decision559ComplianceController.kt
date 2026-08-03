package uz.scorm.lms.app.v1.compliance

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.common.ApiResponse

@RestController
@RequestMapping("/api/v1/compliance/559")
@PreAuthorize("hasAnyAuthority('STAT_READ', 'ACADEMIC_READ', 'AUDIT_READ')")
class Decision559ComplianceController(
    private val complianceService: Decision559ComplianceService,
) {
    @GetMapping("/summary")
    fun summary(): ResponseEntity<ApiResponse<Decision559ComplianceSummaryDto>> =
        ResponseEntity.ok(ApiResponse.success(complianceService.summary()))

    @GetMapping("/requirements")
    fun requirements(): ResponseEntity<ApiResponse<List<Decision559RequirementDto>>> =
        ResponseEntity.ok(ApiResponse.success(complianceService.requirements()))
}
