package uz.scorm.lms.app.security

import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.net.InetAddress

@Component
class ClientIpResolver(
    @Value("\${app.security.trusted-proxy-ips:}") trustedProxyIpsValue: String,
) {
    private val trustedProxyIps = trustedProxyIpsValue.split(',').map(String::trim).filter(String::isNotBlank).toSet()

    fun resolve(request: HttpServletRequest): String {
        val remote = normalize(request.remoteAddr) ?: "unknown"
        if (remote !in trustedProxyIps) return remote
        val forwarded = request.getHeader("X-Forwarded-For")?.substringBefore(',')?.trim().orEmpty()
        return normalize(forwarded) ?: remote
    }

    private fun normalize(value: String?): String? {
        val candidate = value?.trim()?.takeIf(String::isNotBlank) ?: return null
        if (!candidate.matches(Regex("[0-9A-Fa-f:.]{2,45}"))) return null
        return runCatching { InetAddress.getByName(candidate).hostAddress }.getOrNull()
    }
}
