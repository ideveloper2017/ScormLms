package uz.scorm.lms.app.v1.hemis.controller

import jakarta.servlet.http.HttpServletRequest
import mu.KotlinLogging
import org.springframework.beans.factory.ObjectProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository
import org.springframework.web.bind.annotation.GetMapping
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
import uz.scorm.lms.app.v1.hemis.service.HEMIS_EMPLOYEE_REGISTRATION_ID
import uz.scorm.lms.app.v1.hemis.service.HemisOAuthAccountService
import uz.scorm.lms.app.v1.hemis.service.HemisService
import uz.scorm.lms.app.v1.security.service.LoginAttemptService
import uz.scorm.lms.app.v1.user.mapper.UserMapper
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant

private val logger = KotlinLogging.logger {}

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
    private val hemisService: HemisService,
    private val studentAccounts: HemisOAuthAccountService,
    private val loginAttemptService: LoginAttemptService,
    private val clientRegistrations: ObjectProvider<ClientRegistrationRepository>,
    @Value("\${app.hemis.password-login.enabled:true}") private val passwordLoginEnabled: Boolean,
) {
    data class ExchangeRequest(val code: String = "")
    data class PasswordLoginRequest(val login: String = "", val password: String = "")

    /** Login sahifasi qaysi HEMIS kirish usullarini ko'rsatishini aniqlaydi. */
    data class LoginOptions(
        /** Talaba HEMIS login/paroli bilan shu sahifada kiradi. */
        val studentPasswordLogin: Boolean,
        /** Talaba HEMIS sahifasi (OAuth) orqali kiradi. */
        val studentOAuth: Boolean,
        /** O'qituvchi (xodim) HEMIS sahifasi (OAuth) orqali kiradi. */
        val employeeOAuth: Boolean,
    )

    @GetMapping("/options")
    fun options(): ApiResponse<LoginOptions> {
        val registrations = clientRegistrations.ifAvailable
        return ApiResponse.success(LoginOptions(
            studentPasswordLogin = passwordLoginEnabled && hemisService.studentLoginConfigured(),
            studentOAuth = registrations?.findByRegistrationId("hemis") != null,
            employeeOAuth = registrations?.findByRegistrationId(HEMIS_EMPLOYEE_REGISTRATION_ID) != null,
        ))
    }

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
        return issueTokens(request, user, "HEMIS_OAUTH_LOGIN_SUCCESS")
    }

    /** Talaba HEMIS (student.hemis) login va paroli bilan to'g'ridan-to'g'ri kirish. */
    @PostMapping("/login")
    fun passwordLogin(
        request: HttpServletRequest,
        @RequestBody body: PasswordLoginRequest,
    ): ResponseEntity<ApiResponse<TokenResponse>> {
        val login = body.login.trim()
        if (!passwordLoginEnabled || !hemisService.studentLoginConfigured()) {
            return error(HttpStatus.SERVICE_UNAVAILABLE, "HEMIS login orqali kirish sozlanmagan")
        }
        if (login.isEmpty() || body.password.isEmpty() || login.length > 150 || body.password.length > 256) {
            return error(HttpStatus.BAD_REQUEST, "HEMIS login va parolni kiriting")
        }
        // Mahalliy login urinishlaridan alohida hisoblanadi
        val attemptKey = "hemis:${login.lowercase()}"
        if (loginAttemptService.isLocked(attemptKey)) {
            val seconds = loginAttemptService.remainingLock(attemptKey)?.seconds ?: 0
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", seconds.toString())
                .header("Cache-Control", "no-store")
                .body(ApiResponse.error("Urinishlar soni ko'payib ketdi. Keyinroq qayta urinib ko'ring."))
        }

        val hemisToken = try {
            hemisService.studentLogin(login, body.password)
        } catch (exception: Exception) {
            logger.warn { "HEMIS student login request failed: ${exception.javaClass.simpleName}" }
            return error(HttpStatus.SERVICE_UNAVAILABLE, "HEMIS serveriga ulanib bo'lmadi. Keyinroq qayta urinib ko'ring.")
        }
        if (hemisToken == null) {
            loginAttemptService.onFailure(attemptKey, clientIpResolver.resolve(request))
            audit(request, "HEMIS_PASSWORD_LOGIN_FAILURE", login.take(150), 401)
            return error(HttpStatus.UNAUTHORIZED, "HEMIS login yoki parol noto'g'ri")
        }

        val user = try {
            val identity = hemisService.fetchStudentIdentity(hemisToken)
            studentAccounts.resolveStudent(identity.hemisId, identity.studentNumber ?: login)
        } catch (exception: Exception) {
            val (status, message) = when (exception.message) {
                "HEMIS_ACCOUNT_NOT_LINKED" -> HttpStatus.FORBIDDEN to
                    "HEMIS akkauntingiz LMSdagi talaba bilan bog'lanmagan. Administratorga murojaat qiling."
                "HEMIS_ACCOUNT_INACTIVE" -> HttpStatus.FORBIDDEN to "Talaba yoki LMS akkaunti faol emas."
                "HEMIS_ACCOUNT_CONFLICT" -> HttpStatus.CONFLICT to
                    "HEMIS identifikatori boshqa LMS akkaunti bilan zid keldi. Administrator tekshiruvi kerak."
                else -> HttpStatus.SERVICE_UNAVAILABLE to "HEMIS ma'lumotlarini olib bo'lmadi. Keyinroq qayta urinib ko'ring."
            }
            logger.warn { "HEMIS student login account resolution failed: ${exception.message ?: exception.javaClass.simpleName}" }
            return error(status, message)
        }
        loginAttemptService.onSuccess(attemptKey)
        return issueTokens(request, user, "HEMIS_PASSWORD_LOGIN_SUCCESS")
    }

    private fun issueTokens(request: HttpServletRequest, user: User, action: String): ResponseEntity<ApiResponse<TokenResponse>> {
        val userDetails = userDetailsService.loadUserByUsername(user.username)
        val accessToken = jwtService.generateToken(userDetails)
        val refreshToken = refreshTokenService.create(user)
        user.lastLoginAt = Instant.now()
        userRepository.save(user)
        audit(request, action, user.username, 200)

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

    private fun audit(request: HttpServletRequest, action: String, username: String, status: Int) = auditService.log(
        action = action,
        username = username,
        method = request.method,
        path = request.requestURI,
        status = status,
        ip = clientIpResolver.resolve(request),
        userAgent = request.getHeader("User-Agent")?.replace(Regex("[\\r\\n]"), " ")?.take(512),
    )

    private fun error(status: HttpStatus, message: String): ResponseEntity<ApiResponse<TokenResponse>> =
        ResponseEntity.status(status).header("Cache-Control", "no-store").body(ApiResponse.error(message))
}
