package uz.scorm.lms.app.security


import org.springframework.core.MethodParameter
import org.springframework.security.core.Authentication
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Component
import org.springframework.web.bind.support.WebDataBinderFactory
import org.springframework.web.context.request.NativeWebRequest
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.method.support.ModelAndViewContainer
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.lang.annotation.Documented

@Target(AnnotationTarget.VALUE_PARAMETER)
@Retention(AnnotationRetention.RUNTIME)
@Documented
@AuthenticationPrincipal
annotation class CurrentUser

@Component
class CurrentUserArgumentResolver(
    private val userRepository: UserRepository
) : HandlerMethodArgumentResolver {

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
            is UserDetails -> {
                val requestKey = "current_user_${principal.username}"

                (webRequest.getAttribute(requestKey, NativeWebRequest.SCOPE_REQUEST) as? User)?.let {
                    return it
                }

                val user = userRepository.findByUsername(principal.username)
                    ?: throw IllegalStateException("User not found: ${principal.username}")
                webRequest.setAttribute(requestKey, user, NativeWebRequest.SCOPE_REQUEST)
                user
            }
            else -> throw IllegalStateException("Unsupported principal type: ${principal.javaClass.name}")
        }
    }
}