package uz.scorm.lms.app.v1.compliance

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/compliance/559")
@PreAuthorize("hasAnyAuthority('STAT_READ', 'ACADEMIC_READ', 'AUDIT_READ')")
class Decision559ComplianceController(
    private val complianceService: Decision559ComplianceService,
    private val issueService: ComplianceIssueService,
) {
    @GetMapping("/summary")
    fun summary(): ResponseEntity<ApiResponse<Decision559ComplianceSummaryDto>> =
        ResponseEntity.ok(ApiResponse.success(complianceService.summary()))

    @GetMapping("/requirements")
    fun requirements(): ResponseEntity<ApiResponse<List<Decision559RequirementDto>>> =
        ResponseEntity.ok(ApiResponse.success(complianceService.requirements()))

    @GetMapping("/issues")
    fun issues(): ResponseEntity<ApiResponse<List<ComplianceIssueDto>>> =
        ResponseEntity.ok(ApiResponse.success(issueService.list()))

    @GetMapping("/owners")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun owners(): ResponseEntity<ApiResponse<List<ComplianceOwnerDto>>> =
        ResponseEntity.ok(ApiResponse.success(issueService.owners()))

    @PostMapping("/issues")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun createIssue(
        @RequestBody request: CreateComplianceIssueRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<ComplianceIssueDto>> =
        ResponseEntity.ok(ApiResponse.success(issueService.create(request, requireNotNull(user.id))))

    @PutMapping("/issues/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun updateIssue(
        @PathVariable id: Long,
        @RequestBody request: UpdateComplianceIssueRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<ComplianceIssueDto>> =
        ResponseEntity.ok(ApiResponse.success(issueService.update(id, request, requireNotNull(user.id))))

    @PostMapping("/issues/{id}/status")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun changeIssueStatus(
        @PathVariable id: Long,
        @RequestBody request: ChangeComplianceIssueStatusRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<ComplianceIssueDto>> =
        ResponseEntity.ok(ApiResponse.success(issueService.changeStatus(id, request, requireNotNull(user.id))))
}
