package uz.scorm.lms.app.v1.audit.controller

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.audit.model.AuditLog
import uz.scorm.lms.app.v1.audit.service.AuditService

@RestController
@RequestMapping("/api/v1/audit")
class AuditController(private val auditService: AuditService) {

    @GetMapping
    @PreAuthorize("hasAuthority('AUDIT_READ')")
    fun getAllLogs(): List<AuditLog> = auditService.findAll()

    @GetMapping("/user/{username}")
    @PreAuthorize("hasAuthority('AUDIT_READ')")
    fun getByUser(@PathVariable username: String): List<AuditLog> =
        auditService.findByUsername(username)
}
