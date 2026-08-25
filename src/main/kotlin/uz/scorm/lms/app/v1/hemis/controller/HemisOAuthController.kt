package uz.scorm.lms.app.v1.hemis.controller

import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.ClientIpResolver
import uz.scorm.lms.app.security.JwtService
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.auth.controller.TokenResponse
import uz.scorm.lms.app.v1.auth.service.HemisOAuthLoginCodeService
import uz.scorm.lms.app.v1.auth.service.RefreshTokenService
import uz.scorm.lms.app.v1.user.mapper.UserMapper
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant

@RestController
@RequestMapping("/api/v1/auth/hemis")
class HemisOAuthController(
    private val loginCodeService: HemisOAuthLoginCodeService,
    private val userDetailsService: UserDetailsService,
    private val jwtService: JwtService,
    private val refreshTokenService: RefreshTokenService,
    private val userMapper: UserMapper,
    private val userRepository: UserRepository,
    private val auditService: AuditService,
    private val clientIpResolver: ClientIpResolver,
) {
    data class ExchangeRequest(val code: String = "")

    @PostMapping("/exchange")
    fun exchange(
        request: HttpServletRequest,
        @RequestBody body: ExchangeRequest,
    ): ResponseEntity<ApiResponse<TokenResponse>> {
        val user = try {
            loginCodeService.consume(body.code.trim())
        } catch (_: Exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .header("Cache-Control", "no-store")
                .body(ApiResponse.error("HEMIS login kodi yaroqsiz yoki muddati tugagan"))
        }

        val userDetails = userDetailsService.loadUserByUsername(user.username)
        val accessToken = jwtService.generateToken(userDetails)
        val refreshToken = refreshTokenService.create(user)
        user.lastLoginAt = Instant.now()
        userRepository.save(user)
        auditService.log(
            action = "HEMIS_OAUTH_LOGIN_SUCCESS",
            username = user.username,
            method = request.method,
            path = request.requestURI,
            status = 200,
            ip = clientIpResolver.resolve(request),
            userAgent = request.getHeader("User-Agent")?.replace(Regex("[\\r\\n]"), " ")?.take(512),
        )

        return ResponseEntity.ok()
            .header("Cache-Control", "no-store")
            .body(ApiResponse.success(
                TokenResponse(
                    user = userMapper.toDto(user),
                    accessToken = accessToken,
                    refreshToken = refreshToken.token,
                    expiresIn = jwtService.getExpirationInSeconds(accessToken),
                )
            ))
    }
}
