package uz.scorm.lms.app.security

import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.http.MediaType
import org.springframework.security.core.AuthenticationException
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.stereotype.Component
import java.io.IOException
import kotlin.jvm.Throws
import kotlin.jvm.javaClass
import kotlin.to

@Component
class JwtAuthEntryPoint : AuthenticationEntryPoint {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    @Throws(IOException::class)
    override fun commence(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authException: AuthenticationException
    ) {
        logger.error("Unauthorized error: {}", authException.message)
        
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        response.status = HttpServletResponse.SC_UNAUTHORIZED
        
        val body = mutableMapOf<String, Any>(
            "status" to HttpServletResponse.SC_UNAUTHORIZED,
            "error" to "Unauthorized",
            "message" to "You need to login first to access this resource",
            "path" to request.servletPath
        )
        
        val mapper = ObjectMapper()
        mapper.writeValue(response.outputStream, body)
    }
}
