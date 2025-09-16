package uz.idev.app.security


import org.springframework.core.MethodParameter
import org.springframework.security.core.Authentication
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.support.WebDataBinderFactory
import org.springframework.web.context.request.NativeWebRequest
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.method.support.ModelAndViewContainer
import uz.scorm.lms.app.security.UserDetailsImpl
import uz.scorm.lms.app.v1.user.model.User
import java.lang.annotation.Documented

@Target(AnnotationTarget.VALUE_PARAMETER)
@Retention(AnnotationRetention.RUNTIME)
@Documented
@AuthenticationPrincipal
annotation class CurrentUser

class CurrentUserArgumentResolver : HandlerMethodArgumentResolver {

    override fun supportsParameter(parameter: MethodParameter): Boolean {
        return parameter.parameterType == User::class.java &&
                parameter.hasParameterAnnotation(CurrentUser::class.java)
    }

    override fun resolveArgument(
        parameter: MethodParameter,
        mavContainer: ModelAndViewContainer?,
        webRequest: NativeWebRequest,
        binderFactory: WebDataBinderFactory?
    ): Any? {
        val authentication: Authentication = SecurityContextHolder.getContext().authentication
            ?: throw IllegalStateException("No authentication found in security context")

        return when (val principal = authentication.principal) {
            is User -> principal
            is UserDetailsImpl -> {
                // Get user from request cache if available
                val userId = principal.getId()
                val requestKey = "current_user_$userId"

                (webRequest.getAttribute(requestKey, NativeWebRequest.SCOPE_REQUEST) as? User)?.let {
                    return it
                }

                // Otherwise get the user from UserDetailsImpl
                val user = principal.getUser()
                webRequest.setAttribute(requestKey, user, NativeWebRequest.SCOPE_REQUEST)
                user
            }
            is UserDetails -> throw IllegalStateException("Unsupported UserDetails implementation: ${principal.javaClass.name}")
            else -> throw IllegalStateException("Unsupported principal type: ${principal.javaClass.name}")
        }
    }
}
