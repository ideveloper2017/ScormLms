package uz.scorm.lms.app.v1.auth.controller

import com.fasterxml.jackson.annotation.JsonInclude
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import jakarta.servlet.http.HttpServletRequest
import mu.KotlinLogging
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.auth.dto.JwtResponse
import uz.scorm.lms.app.common.ApiResponse as CommonApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponse as SwaggerApiResponse
import uz.scorm.lms.app.security.JwtService
import uz.scorm.lms.app.security.ClientIpResolver
import uz.scorm.lms.app.v1.auth.service.RefreshTokenCookie
import uz.scorm.lms.app.v1.auth.service.RefreshTokenService
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.twofactor.service.TwoFactorService
import uz.scorm.lms.app.v1.security.service.LoginAttemptService
import uz.scorm.lms.app.v1.user.dto.ForgotPasswordRequest
import uz.scorm.lms.app.v1.user.dto.PasswordChangeRequest
import uz.scorm.lms.app.v1.user.dto.ResetPasswordWithTokenRequest
import uz.scorm.lms.app.v1.user.dto.UserDto
import uz.scorm.lms.app.v1.user.mapper.UserMapper
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.service.UserService
import java.time.Duration
import java.time.Instant

private val logger = KotlinLogging.logger {}

data class LoginRequest(val username: String = "", val password: String = "")
data class TokenResponse(
    val user: UserDto,
    val accessToken: String,
    /** Refresh token javob tanasida berilmaydi: u HttpOnly cookie'da (RefreshTokenCookie), JavaScript o'qiy olmaydi. */
    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    val refreshToken: String? = null,
    val expiresIn: Long
)
@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val authenticationManager: AuthenticationManager,
    private val jwtService: JwtService,
    private val userMapper: UserMapper,
    private val refreshTokenService: RefreshTokenService,
    private val userRepository: UserRepository,
    private val userDetailsService: UserDetailsService,
    private val twoFactorService: TwoFactorService,
    private val loginAttemptService: LoginAttemptService,
    private val userService: UserService,
    private val clientIpResolver: ClientIpResolver,
    private val auditService: AuditService,
    private val refreshTokenCookie: RefreshTokenCookie,
) {

    data class RefreshRequest(val refreshToken: String? = null)
    data class ErrorResponse(val message: String, val retryAfterSeconds: Long? = null)

    @PostMapping("/login")
    fun login(request: HttpServletRequest, @RequestBody body: LoginRequest): ResponseEntity<Any> {
        val clientIp = clientIpResolver.resolve(request)
        // Check lock before authenticating
        if (loginAttemptService.isLocked(body.username)) {
            val remaining: Duration? = loginAttemptService.remainingLock(body.username)
            val seconds = (remaining?.seconds ?: 0)
            auditService.log(
                action = "LOGIN_BLOCKED",
                username = body.username.trim().take(150),
                method = request.method,
                path = request.requestURI,
                status = 429,
                ip = clientIp,
                userAgent = request.getHeader("User-Agent")?.replace(Regex("[\\r\\n]"), " ")?.take(512),
            )
            return ResponseEntity.status(429) // Too Many Requests
                .header("Retry-After", seconds.toString())
                .body(
                    ErrorResponse(
                        message = "Login qilish bo'yicha urinishlar soni ko'payib ketdi. Iltimos, keyinroq qayta urinib ko'ring.",
                        retryAfterSeconds = seconds
                    )
                )
        }
        val authToken = UsernamePasswordAuthenticationToken(body.username, body.password)
        val authentication: Authentication = try {
            authenticationManager.authenticate(authToken)
        } catch (ex: Exception) {
            // record failed attempt and return 401
            loginAttemptService.onFailure(body.username, clientIp)
            auditService.log(
                action = "LOGIN_FAILURE",
                username = body.username.trim().take(150),
                method = request.method,
                path = request.requestURI,
                status = 401,
                ip = clientIp,
                userAgent = request.getHeader("User-Agent")?.replace(Regex("[\\r\\n]"), " ")?.take(512),
            )
            return ResponseEntity.status(401).body(
                ErrorResponse(
                    message = "Login yoki parol noto'g'ri"
                )
            )
        }
        val principal = authentication.principal as UserDetails
        val userEntity = userRepository.findByUsername(principal.username)
            ?: throw IllegalStateException("User not found: ${principal.username}")

//
//        if (userEntity.twoFactorEnabled) {
//            val code = body.otpCode?.toIntOrNull()
//            if (code == null || userEntity.twoFactorSecret.isNullOrBlank() ||
//                !twoFactorService.verifyCode(userEntity.twoFactorSecret!!, code)
//            ) {
//                // 2FA failure also counts as failed attempt
//                loginAttemptService.onFailure(body.username, clientIp)
//                return ResponseEntity.status(403).body(ErrorResponse(
//                    message = "2FA (OTP) kodi noto'g'ri"
//                ))
//            }
//        }
        // success: reset attempts
        loginAttemptService.onSuccess(body.username)
        userEntity.lastLoginAt = Instant.now()
        userRepository.save(userEntity)
        auditService.log(
            action = "LOGIN_SUCCESS",
            username = userEntity.username,
            method = request.method,
            path = request.requestURI,
            status = 200,
            ip = clientIp,
            userAgent = request.getHeader("User-Agent")?.replace(Regex("[\\r\\n]"), " ")?.take(512),
        )
        val authorities = principal.authorities.map { it.authority }
//        val roles = authorities.filter { it.startsWith("ROLE_") }.map { it.removePrefix("ROLE_") }
//        val permissions = authorities.filterNot { it.startsWith("ROLE_") }
        val token = jwtService.generateToken(principal)
        val refresh = refreshTokenService.create(userEntity)
        val userDto = userMapper.toDto(userEntity);
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.issue(request, refresh.token))
            .header(HttpHeaders.CACHE_CONTROL, "no-store")
            .body(
                CommonApiResponse.success(
                    TokenResponse(
                        user = userDto,
                        accessToken = token,
                        expiresIn = jwtService.getExpirationInSeconds(token)
                    )
                )
            )
    }

    @Deprecated("Use /refresh-token endpoint instead")
    @PostMapping("/refresh")
    fun refresh(request: HttpServletRequest, @RequestBody body: RefreshRequest): ResponseEntity<CommonApiResponse<JwtResponse>> {
        return refreshToken(request, body.refreshToken?.let { "Bearer $it" })
    }

    @PostMapping("/refresh-token")
    @Operation(
        summary = "Refresh access token",
        description = "Refreshes the access token using a refresh token",
        responses = [
            SwaggerApiResponse(
                responseCode = "200",
                description = "Successfully refreshed token",
                content = [Content(schema = Schema(implementation = JwtResponse::class))]
            ),
            SwaggerApiResponse(
                responseCode = "401",
                description = "Invalid or expired refresh token",
                content = [Content(schema = Schema(implementation = CommonApiResponse::class))]
            )
        ]
    )
    fun refreshToken(
        request: HttpServletRequest,
        @RequestHeader("Authorization", required = false) authorization: String?,
    ): ResponseEntity<CommonApiResponse<JwtResponse>> {
        // Brauzer: HttpOnly cookie. Eski/brauzer bo'lmagan mijozlar: Authorization sarlavhasi (faqat ularga
        // yangi token javob tanasida qaytadi; cookie esa har doim yangilanadi).
        val cookieToken = refreshTokenCookie.read(request)
        val headerToken = authorization?.substringAfter("Bearer ")?.trim()?.takeIf { it.isNotEmpty() }
        val token = cookieToken ?: headerToken
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(CommonApiResponse.error(message = "Sessiya topilmadi. Tizimga qayta kiring."))

        return try {
            val storedToken = refreshTokenService.validate(token)
            val username = storedToken.user?.username
                ?: throw IllegalStateException("Refresh token foydalanuvchisi topilmadi")
            val userDetails = userDetailsService.loadUserByUsername(username)
            val newAccessToken = jwtService.generateToken(userDetails)
            val rotatedToken = refreshTokenService.rotate(token)

            ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.issue(request, rotatedToken.token))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(CommonApiResponse.success(JwtResponse(
                    accessToken = newAccessToken,
                    refreshToken = rotatedToken.token.takeIf { cookieToken == null },
                    expiresIn = jwtService.getExpirationInSeconds(newAccessToken),
                )))
        } catch (e: Exception) {
            // Muddati o'tgan yoki bekor qilingan token — kutilgan holat, stack trace kerak emas
            logger.warn { "Token refresh rad etildi: ${e.message}" }
            ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.clear(request))
                .body(CommonApiResponse.error(message = "Sessiya tugagan. Tizimga qayta kiring."))
        }
    }

    @GetMapping(
        "/me",
        produces = ["application/json"]
    )
    @Operation(
        summary = "Get current user details",
        description = "Returns the details of the currently authenticated user",
        security = [SecurityRequirement(name = "bearerAuth")],
        responses = [
            SwaggerApiResponse(
                responseCode = "200",
                description = "Successfully retrieved user details",
                content = [Content(schema = Schema(implementation = UserDto::class))]
            ),
            SwaggerApiResponse(
                responseCode = "401",
                description = "Unauthorized",
                content = [Content(schema = Schema(implementation = CommonApiResponse::class))]
            )
        ]
    )
    fun getCurrentUser(@CurrentUser user: User): ResponseEntity<CommonApiResponse<UserDto>> {
        return ResponseEntity.ok(CommonApiResponse.success(userMapper.toDto(user)))
    }

    @PostMapping("/forgot-password")
    fun forgotPassword(@RequestBody request: ForgotPasswordRequest): ResponseEntity<Any> {
        userService.forgotPassword(request)
        // Xavfsizlik uchun email topilmasa ham xuddi shunday javob qaytariladi
        return ResponseEntity.ok(mapOf("message" to "Agar email tizimda mavjud bo'lsa, reset havolasi yuborildi"))
    }

    @PostMapping("/reset-password")
    fun resetPassword(@RequestBody request: ResetPasswordWithTokenRequest): ResponseEntity<Any> {
        return try {
            userService.resetPasswordWithToken(request)
            ResponseEntity.ok(mapOf("message" to "Parol muvaffaqiyatli o'zgartirildi"))
        } catch (ex: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf("message" to ex.message))
        }
    }

    @PostMapping("/change-password")
    fun changePassword(
        @CurrentUser user: User,
        @RequestBody request: PasswordChangeRequest
    ): ResponseEntity<Any> {
        return try {
            userService.changePassword(user.username, request)
            ResponseEntity.noContent().build<Any>()
        } catch (ex: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf("message" to ex.message))
        }
    }

    @PostMapping("/logout")
    fun logout(request: HttpServletRequest, @RequestBody(required = false) body: RefreshRequest?): ResponseEntity<Void> {
        // Cookie'dagi va (eski mijozlar yuborgan) tanadagi token bekor qilinadi, cookie o'chiriladi
        listOfNotNull(refreshTokenCookie.read(request), body?.refreshToken?.takeIf { it.isNotBlank() })
            .distinct()
            .forEach(refreshTokenService::revoke)
        return ResponseEntity.noContent()
            .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.clear(request))
            .build()
    }

}
