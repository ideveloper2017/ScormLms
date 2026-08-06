package uz.scorm.lms.app.v1.audit.service

import jakarta.servlet.http.HttpServletRequest
import org.springframework.stereotype.Service
import uz.scorm.lms.app.security.ClientIpResolver
import uz.scorm.lms.app.v1.audit.model.AuditLog
import uz.scorm.lms.app.v1.audit.repository.AuditLogRepository
import java.time.Instant

@Service
class AuditService(
    private val auditLogRepository: AuditLogRepository,
    private val clientIpResolver: ClientIpResolver,
) {
    fun log(action: String, details: String? = null, username: String? = null,
            method: String? = null, path: String? = null, status: Int? = null,
            ip: String? = null, userAgent: String? = null) {
        val log = AuditLog(
            timestamp = Instant.now(),
            username = username,
            action = action,
            details = details,
            method = method,
            path = path,
            status = status,
            ip = ip,
            userAgent = userAgent
        )
        auditLogRepository.save(log)
    }

    fun logRequest(action: String = "API_REQUEST", request: HttpServletRequest, status: Int?, username: String?, details: String? = null) {
        val ip = clientIpResolver.resolve(request)
        val ua = request.getHeader("User-Agent")?.replace(Regex("[\\r\\n]"), " ")?.take(512)
        log(
            action = action,
            details = details,
            username = username,
            method = request.method,
            path = request.requestURI,
            status = status,
            ip = ip,
            userAgent = ua
        )
    }

    fun findAll(): List<AuditLog> = auditLogRepository.findTop200ByOrderByTimestampDesc()

    fun findByUsername(username: String): List<AuditLog> =
        auditLogRepository.findByUsernameOrderByTimestampDesc(username)

    fun logAction(action: String, userId: Long, details: String? = null) {
        log(action = action, details = details, username = userId.toString())
    }
}
