package uz.scorm.lms.app.v1.audit.filter

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import mu.KotlinLogging
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import uz.scorm.lms.app.v1.audit.service.AuditService

private val logger = KotlinLogging.logger {}

@Component
class AuditLoggingFilter(
    private val auditService: AuditService
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val startedAt = System.currentTimeMillis()
        try {
            filterChain.doFilter(request, response)
        } finally {
            val durationMs = System.currentTimeMillis() - startedAt
            val anonymousSurveySubmission = request.method == "POST" &&
                Regex(".*/surveys/\\d+/responses$").matches(request.requestURI)
            val username = SecurityContextHolder.getContext().authentication?.name
                .takeUnless { anonymousSurveySubmission }
            val requestId = (request.getHeader("X-Request-Id") ?: request.getHeader("X-Correlation-Id"))
                ?.takeIf { it.matches(Regex("[A-Za-z0-9._:-]{1,128}")) }
            val details = buildString {
                append("durationMs=").append(durationMs)
                requestId?.let { append(", requestId=").append(it) }
                response.contentType?.take(100)?.let { append(", respType=").append(it) }
                response.getHeader("Content-Length")?.take(20)?.let { append(", respLen=").append(it) }
            }
            runCatching {
                if (anonymousSurveySubmission) {
                    auditService.log(
                        action = "ANONYMOUS_SURVEY_RESPONSE",
                        details = "durationMs=$durationMs, status=${response.status}",
                        method = request.method,
                        path = request.requestURI,
                        status = response.status,
                    )
                } else {
                    auditService.logRequest(
                        action = "API_REQUEST",
                        request = request,
                        status = response.status,
                        username = username,
                        details = details,
                    )
                }
            }.onFailure { logger.warn { "Request auditini saqlashda xatolik: ${it.message}" } }
        }
    }

    override fun shouldNotFilter(request: HttpServletRequest): Boolean = request.requestURI.let {
        it.startsWith("/actuator/health") || it.startsWith("/actuator/info") ||
            it.startsWith("/swagger-ui") || it.startsWith("/v3/api-docs") ||
            it.startsWith("/scorm-content/") || it.startsWith("/ws")
    }
}
