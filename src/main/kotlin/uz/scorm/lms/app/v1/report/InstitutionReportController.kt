package uz.scorm.lms.app.v1.report

import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.user.model.User
import java.time.LocalDate

@RestController
@RequestMapping("/api/v1/reports/institution")
@PreAuthorize("hasAnyAuthority('REPORT_READ', 'STAT_READ')")
class InstitutionReportController(
    private val service: InstitutionReportService,
    private val completenessService: ContentCompletenessService,
) {
    @GetMapping
    fun report(@CurrentUser user: User, authentication: Authentication, @RequestParam from: LocalDate?, @RequestParam to: LocalDate?) =
        ResponseEntity.ok(ApiResponse.success(service.report(requireNotNull(user.id), institutionScope(authentication), from, to)))

    @GetMapping("/export")
    fun export(@CurrentUser user: User, authentication: Authentication, @RequestParam from: LocalDate?, @RequestParam to: LocalDate?, @RequestParam format: ReportExportFormat): ResponseEntity<ByteArray> {
        val export = service.export(requireNotNull(user.id), institutionScope(authentication), from, to, format)
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"${export.filename}\"")
            .contentType(MediaType.parseMediaType(export.contentType))
            .body(export.bytes)
    }

    @GetMapping("/content-completeness")
    fun contentCompleteness(
        @CurrentUser user: User,
        authentication: Authentication,
        @RequestParam academicYear: String?,
    ) = ResponseEntity.ok(ApiResponse.success(
        completenessService.report(requireNotNull(user.id), institutionScope(authentication), academicYear),
    ))

    private fun institutionScope(authentication: Authentication) = authentication.authorities.any {
        it.authority in setOf("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_METODIST", "ROLE_MONITORING")
    }
}
