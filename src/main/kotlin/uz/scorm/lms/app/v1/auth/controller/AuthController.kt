package uz.scorm.lms.app.v1.auth.controller

import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.JwtService
import uz.scorm.lms.app.v1.auth.service.RefreshTokenService
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.twofactor.service.TwoFactorService
import uz.scorm.lms.app.v1.security.service.LoginAttemptService
import java.time.Duration

@RestController
@RequestMapping("/auth")
class AuthController(
    private val authenticationManager: AuthenticationManager,
    private val jwtService: JwtService,
    private val refreshTokenService: RefreshTokenService,
    private val userRepository: UserRepository,
    private val userDetailsService: UserDetailsService,
    private val twoFactorService: TwoFactorService,
    private val loginAttemptService: LoginAttemptService
) {
    data class LoginRequest(val username: String = "", val password: String = "", val otpCode: String? = null)
    data class TokenResponse(
        val username: String,
        val roles: List<String>,
        val permissions: List<String>,
        val accessToken: String,
        val refreshToken: String
    )
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
        if (userEntity.twoFactorEnabled) {
            val code = body.otpCode?.toIntOrNull()
            if (code == null || userEntity.twoFactorSecret.isNullOrBlank() ||
                !twoFactorService.verifyCode(userEntity.twoFactorSecret!!, code)
            ) {
                // 2FA failure also counts as failed attempt
                loginAttemptService.onFailure(body.username, clientIp)
                return ResponseEntity.status(403).body(ErrorResponse(
                    message = "2FA (OTP) kodi noto'g'ri"
                ))
            }
        }
        // success: reset attempts
        loginAttemptService.onSuccess(body.username)
        val authorities = principal.authorities.map { it.authority }
        val roles = authorities.filter { it.startsWith("ROLE_") }.map { it.removePrefix("ROLE_") }
        val permissions = authorities.filterNot { it.startsWith("ROLE_") }
        val token = jwtService.generateToken(principal)
        val refresh = refreshTokenService.create(userEntity)
        return ResponseEntity.ok(TokenResponse(
            username = principal.username,
            roles = roles,
            permissions = permissions,
            accessToken = token,
            refreshToken = refresh.token
        ))
    }

    @PostMapping("/refresh")
    fun refresh(@RequestBody body: RefreshRequest): ResponseEntity<TokenResponse> {
        val newRefresh = refreshTokenService.rotate(body.refreshToken)
        val username = newRefresh.user!!.username
        val userDetails = userDetailsService.loadUserByUsername(username)
        val authorities = userDetails.authorities.map { it.authority }
        val roles = authorities.filter { it.startsWith("ROLE_") }.map { it.removePrefix("ROLE_") }
        val permissions = authorities.filterNot { it.startsWith("ROLE_") }
        val access = jwtService.generateToken(userDetails)
        return ResponseEntity.ok(
            TokenResponse(
                username = username,
                roles = roles,
                permissions = permissions,
                accessToken = access,
                refreshToken = newRefresh.token
            )
        )
    }

    @PostMapping("/logout")
    fun logout(@RequestBody body: RefreshRequest): ResponseEntity<Void> {
        refreshTokenService.revoke(body.refreshToken)
        return ResponseEntity.noContent().build()
    }
}