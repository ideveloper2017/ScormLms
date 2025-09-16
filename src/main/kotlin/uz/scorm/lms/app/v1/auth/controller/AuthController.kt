package uz.scorm.lms.app.v1.auth.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import jakarta.servlet.http.HttpServletRequest
import mu.KotlinLogging
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
import uz.idev.app.security.CurrentUser
import uz.idev.app.v1.auth.dto.JwtResponse
import uz.scorm.lms.app.common.ApiResponse as CommonApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponse as SwaggerApiResponse
import uz.scorm.lms.app.security.JwtService
import uz.scorm.lms.app.v1.auth.service.RefreshTokenService
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.twofactor.service.TwoFactorService
import uz.scorm.lms.app.v1.security.service.LoginAttemptService
import uz.scorm.lms.app.v1.user.dto.UserDto
import uz.scorm.lms.app.v1.user.mapper.UserMapper
import uz.scorm.lms.app.v1.user.model.User
import java.time.Duration

private val logger = KotlinLogging.logger {}

data class LoginRequest(val username: String = "", val password: String = "")
data class TokenResponse(
    val user: UserDto,
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long
)
@RestController
@RequestMapping("/auth")
class AuthController(
    private val authenticationManager: AuthenticationManager,
    private val jwtService: JwtService,
    private val userMapper: UserMapper,
    private val refreshTokenService: RefreshTokenService,
    private val userRepository: UserRepository,
    private val userDetailsService: UserDetailsService,
    private val twoFactorService: TwoFactorService,
    private val loginAttemptService: LoginAttemptService
) {

    data class RefreshRequest(val refreshToken: String)
    data class ErrorResponse(val message: String, val retryAfterSeconds: Long? = null)

    @PostMapping("/login")
    fun login(request: HttpServletRequest, @RequestBody body: LoginRequest): ResponseEntity<Any> {
        val clientIp = request.getHeader("X-Forwarded-For")?.split(",")?.firstOrNull()?.trim()
            ?: request.remoteAddr
        // Check lock before authenticating
        if (loginAttemptService.isLocked(body.username)) {
            val remaining: Duration? = loginAttemptService.remainingLock(body.username)
            val seconds = (remaining?.seconds ?: 0)
            return ResponseEntity.status(429) // Too Many Requests
                .header("Retry-After", seconds.toString())
                .body(ErrorResponse(
                    message = "Login qilish bo'yicha urinishlar soni ko'payib ketdi. Iltimos, keyinroq qayta urinib ko'ring.",
                    retryAfterSeconds = seconds
                ))
        }
        val authToken = UsernamePasswordAuthenticationToken(body.username, body.password)
        val authentication: Authentication = try {
            authenticationManager.authenticate(authToken)
        } catch (ex: Exception) {
            // record failed attempt and return 401
            loginAttemptService.onFailure(body.username, clientIp)
            return ResponseEntity.status(401).body(ErrorResponse(
                message = "Login yoki parol noto'g'ri"
            ))
        }
        val principal = authentication.principal as UserDetails
        // Enforce email verification and 2FA if enabled
        val userEntity = userRepository.findByUsername(principal.username)
            ?: throw IllegalStateException("User not found: ${'$'}{principal.username}")
        if (userEntity.email != null && !userEntity.emailVerified) {
            return ResponseEntity.status(403).body(ErrorResponse(
                message = "Email tasdiqlanmagan. Iltimos, email manzilingizni tasdiqlang."
            ))
        }

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
        val authorities = principal.authorities.map { it.authority }
//        val roles = authorities.filter { it.startsWith("ROLE_") }.map { it.removePrefix("ROLE_") }
//        val permissions = authorities.filterNot { it.startsWith("ROLE_") }
        val token = jwtService.generateToken(principal)
        val refresh = refreshTokenService.create(userEntity)
        val userDto = userMapper.toDto(userEntity);
        return ResponseEntity.ok(
            CommonApiResponse.success(TokenResponse(
                user = userDto,
                accessToken = token,
                refreshToken = refresh.token,
                expiresIn = jwtService.getExpirationInSeconds(token)
            ))
        )
    }

    @Deprecated("Use /refresh-token endpoint instead")
    @PostMapping("/refresh")
    fun refresh(@RequestBody body: RefreshRequest): ResponseEntity<CommonApiResponse<JwtResponse>> {
        return refreshToken("Bearer ${body.refreshToken}")
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
    fun refreshToken(@RequestHeader("Authorization") refreshToken: String): ResponseEntity<CommonApiResponse<JwtResponse>> {
        return try {
            // Remove 'Bearer ' prefix if present
            val token = refreshToken.substringAfter("Bearer ").trim()

            // First, try to validate the token with JWT service
            if (!jwtService.isRefreshToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(CommonApiResponse.error(message = "Invalid token type"))
            }

            // Get username from token
            val username = jwtService.getUsernameFromToken(token) ?:
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(CommonApiResponse.error(message = "Invalid token"))

            // Verify token is not expired
            if (jwtService.isTokenExpired(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(CommonApiResponse.error(message = "Token expired"))
            }

            // Load user details
            val userDetails = try {
                userDetailsService.loadUserByUsername(username)
            } catch (e: Exception) {
                logger.error("User not found: $username", e)
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(CommonApiResponse.error(message = "User not found"))
            }

            // Generate new tokens
            try {
                val newAccessToken = jwtService.generateAccessToken(userDetails)
                val newRefreshToken = jwtService.generateRefreshToken(userDetails)

                // Revoke the old refresh token
                try {
                    refreshTokenService.revoke(token)
                } catch (e: Exception) {
                    logger.warn("Failed to revoke old refresh token: ${e.message}")
                    // Continue even if revocation fails
                }

                ResponseEntity.ok(CommonApiResponse.success(
                    JwtResponse(
                        accessToken = newAccessToken,
                        refreshToken = newRefreshToken,
                        expiresIn = jwtService.getExpirationInSeconds(newAccessToken)
                    )
                ))
            } catch (e: Exception) {
                logger.error("Failed to generate new tokens: ${e.message}", e)
                ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(CommonApiResponse.error(message = "Failed to generate tokens"))
            }
        } catch (e: Exception) {
            logger.error("Token refresh failed: ${e.message}", e)
            val errorMessage = when (e) {
                is IllegalStateException -> e.message ?: "Invalid token"
                else -> "Failed to refresh token"
            }
            ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(CommonApiResponse.error(message = errorMessage))
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
    fun getCurrentUser(@CurrentUser user: User): ResponseEntity<CommonApiResponse<Pair<UserDto.Companion, User>>?> {
        val userDto = UserDto.to(user)
        return ResponseEntity.ok(CommonApiResponse.success(userDto))
    }

    @PostMapping("/logout")
    fun logout(@RequestBody body: RefreshRequest): ResponseEntity<Void> {
        refreshTokenService.revoke(body.refreshToken)
        return ResponseEntity.noContent().build()
    }
}