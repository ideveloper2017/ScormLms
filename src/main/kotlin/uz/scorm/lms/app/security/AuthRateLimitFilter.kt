package uz.scorm.lms.app.security

import tools.jackson.databind.ObjectMapper
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.time.Clock
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

@Component
class AuthRateLimitFilter(
    private val clientIpResolver: ClientIpResolver,
    private val objectMapper: ObjectMapper,
    @Value("\${app.security.rate-limit.window-seconds:900}") private val windowSeconds: Long,
    @Value("\${app.security.rate-limit.login-per-ip:30}") private val loginPerIp: Int,
    @Value("\${app.security.rate-limit.external-auth-per-ip:20}") private val externalAuthPerIp: Int,
    @Value("\${app.security.rate-limit.token-per-ip:60}") private val tokenPerIp: Int,
    @Value("\${app.security.rate-limit.max-buckets:10000}") private val maxBuckets: Int,
    private val clock: Clock = Clock.systemUTC(),
) : OncePerRequestFilter() {
    private data class Bucket(val startedAtEpochSecond: Long, var count: Int)
    private data class Rule(val group: String, val limit: Int)

    private val buckets = ConcurrentHashMap<String, Bucket>()
    private val requestCounter = AtomicLong()

    override fun shouldNotFilter(request: HttpServletRequest): Boolean =
        request.method != "POST" || rule(request.requestURI) == null

    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, filterChain: FilterChain) {
        val rule = requireNotNull(rule(request.requestURI))
        val now = clock.instant().epochSecond
        val key = "${rule.group}:${clientIpResolver.resolve(request)}"
        if (!consume(key, rule.limit, now)) {
            response.status = 429
            response.contentType = MediaType.APPLICATION_JSON_VALUE
            response.characterEncoding = Charsets.UTF_8.name()
            response.setHeader("Retry-After", windowSeconds.toString())
            response.setHeader("Cache-Control", "no-store")
            objectMapper.writeValue(response.writer, mapOf(
                "success" to false,
                "message" to "Juda ko'p so'rov yuborildi. Keyinroq qayta urinib ko'ring.",
            ))
            return
        }
        filterChain.doFilter(request, response)
    }

    private fun rule(path: String): Rule? = when (path) {
        "/api/v1/auth/login" -> Rule("login", loginPerIp)
        "/api/v1/auth/hemis/exchange" -> Rule("hemis", externalAuthPerIp)
        "/api/v1/auth/refresh", "/api/v1/auth/refresh-token", "/api/v1/auth/forgot-password",
        "/api/v1/auth/reset-password", "/api/v1/auth/logout" -> Rule("token", tokenPerIp)
        else -> null
    }

    private fun consume(key: String, limit: Int, now: Long): Boolean {
        require(windowSeconds > 0 && limit > 0 && maxBuckets > 0) { "Rate-limit konfiguratsiyasi musbat bo'lishi kerak" }
        if (requestCounter.incrementAndGet() % 100L == 0L) cleanup(now)
        if (!buckets.containsKey(key) && buckets.size >= maxBuckets) {
            cleanup(now)
            if (buckets.size >= maxBuckets) return false
        }
        var allowed = false
        buckets.compute(key) { _, current ->
            val bucket = if (current == null || now - current.startedAtEpochSecond >= windowSeconds) Bucket(now, 0) else current
            if (bucket.count < limit) {
                bucket.count += 1
                allowed = true
            }
            bucket
        }
        return allowed
    }

    private fun cleanup(now: Long) {
        buckets.entries.removeIf { now - it.value.startedAtEpochSecond >= windowSeconds }
    }
}
