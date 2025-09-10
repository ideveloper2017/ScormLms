package uz.scorm.lms.app.v1.audit.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.audit.model.AuditLog

interface AuditLogRepository : JpaRepository<AuditLog, Long> {
}
