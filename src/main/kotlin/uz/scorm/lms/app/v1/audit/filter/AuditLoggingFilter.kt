package uz.scorm.lms.app.v1.audit.filter

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import uz.scorm.lms.app.v1.audit.service.AuditService

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
        filterChain.doFilter(request, response)
        val durationMs = System.currentTimeMillis() - startedAt
        val username = SecurityContextHolder.getContext().authentication?.name
        val qs = request.queryString?.let { "?$it" } ?: ""
        val referer = request.getHeader("Referer")
        val requestId = request.getHeader("X-Request-Id") ?: request.getHeader("X-Correlation-Id")
        val respType = response.contentType
        val contentLength = response.getHeader("Content-Length")
        val details = buildString {
            append("durationMs=").append(durationMs)
            if (qs.isNotEmpty()) append(", qs=").append(qs)
            if (!referer.isNullOrBlank()) append(", referer=").append(referer)
            if (!requestId.isNullOrBlank()) append(", requestId=").append(requestId)
            if (!respType.isNullOrBlank()) append(", respType=").append(respType)
            if (!contentLength.isNullOrBlank()) append(", respLen=").append(contentLength)
        }
        auditService.logRequest(
            action = "API_REQUEST",
            request = request,
            status = response.status,
            username = username
        )
        // Store additional details via direct log call so it persists in DB
        auditService.log(
            action = "API_REQUEST_DETAILS",
            details = details,
            username = username,
            method = request.method,
            path = request.requestURI,
            status = response.status,
            ip = request.getHeader("X-Forwarded-For")?.split(",")?.firstOrNull()?.trim() ?: request.remoteAddr,
            userAgent = request.getHeader("User-Agent")
        )
    }
}
