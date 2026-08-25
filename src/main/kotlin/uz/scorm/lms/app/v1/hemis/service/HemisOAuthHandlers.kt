package uz.scorm.lms.app.v1.hemis.service

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import mu.KotlinLogging
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.Authentication
import org.springframework.security.core.AuthenticationException
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.security.web.authentication.AuthenticationFailureHandler
import org.springframework.security.web.authentication.AuthenticationSuccessHandler
import org.springframework.stereotype.Component
import org.springframework.web.util.UriComponentsBuilder
import uz.scorm.lms.app.v1.auth.service.HemisOAuthLoginCodeService
import java.net.URI

private val logger = KotlinLogging.logger {}

@Component
class HemisOAuthSuccessHandler(
    private val accountService: HemisOAuthAccountService,
    private val loginCodeService: HemisOAuthLoginCodeService,
    @Value("\${app.hemis.oauth.frontend-callback-url:http://localhost:5173/auth/hemis/callback}")
    private val frontendCallbackUrl: String,
) : AuthenticationSuccessHandler {
    init {
        requireValidCallback(frontendCallbackUrl)
    }

    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication,
    ) {
        val principal = authentication.principal as? OAuth2User
        if (principal == null) {
            redirect(response, "invalid_principal")
            return
        }

        try {
            val user = accountService.resolveActiveUser(principal)
            val code = loginCodeService.issue(user)
            request.getSession(false)?.invalidate()
            response.setHeader("Cache-Control", "no-store")
            response.sendRedirect(
                UriComponentsBuilder.fromUriString(frontendCallbackUrl)
                    .queryParam("code", code)
                    .build()
                    .encode()
                    .toUriString()
            )
        } catch (exception: Exception) {
            val error = when (exception.message) {
                "HEMIS_ACCOUNT_NOT_LINKED" -> "account_not_linked"
                "HEMIS_ACCOUNT_INACTIVE" -> "account_inactive"
                "HEMIS_ACCOUNT_CONFLICT" -> "account_conflict"
                else -> "oauth_failed"
            }
            logger.warn { "HEMIS OAuth account resolution failed: $error" }
            request.getSession(false)?.invalidate()
            redirect(response, error)
        }
    }

    private fun redirect(response: HttpServletResponse, error: String) {
        response.setHeader("Cache-Control", "no-store")
        response.sendRedirect(
            UriComponentsBuilder.fromUriString(frontendCallbackUrl)
                .queryParam("error", error)
                .build()
                .encode()
                .toUriString()
        )
    }
}

@Component
class HemisOAuthFailureHandler(
    @Value("\${app.hemis.oauth.frontend-callback-url:http://localhost:5173/auth/hemis/callback}")
    private val frontendCallbackUrl: String,
) : AuthenticationFailureHandler {
    init {
        requireValidCallback(frontendCallbackUrl)
    }

    override fun onAuthenticationFailure(
        request: HttpServletRequest,
        response: HttpServletResponse,
        exception: AuthenticationException,
    ) {
        logger.warn { "HEMIS OAuth provider authentication failed: ${exception.javaClass.simpleName}" }
        request.getSession(false)?.invalidate()
        response.setHeader("Cache-Control", "no-store")
        response.sendRedirect(
            UriComponentsBuilder.fromUriString(frontendCallbackUrl)
                .queryParam("error", "provider_rejected")
                .build()
                .encode()
                .toUriString()
        )
    }
}

private fun requireValidCallback(value: String) {
    val uri = runCatching { URI(value) }.getOrNull()
    require(uri?.scheme in setOf("http", "https") && !uri?.host.isNullOrBlank()) {
        "HEMIS_OAUTH_FRONTEND_CALLBACK_URL to'liq HTTP/HTTPS URL bo'lishi kerak"
    }
}
